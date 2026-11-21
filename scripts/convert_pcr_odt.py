#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
環境部「已制訂PCR清單.odt」自動轉換為 data/pcr_list.json 工具腳本
使用方式：
    python scripts/convert_pcr_odt.py [輸入ODT路徑] [輸出JSON路徑]
預設：
    輸入：./已制訂PCR清單.odt
    輸出：./data/pcr_list.json
"""

import sys
import os
import re
import json
import zipfile
from datetime import datetime, date
import xml.etree.ElementTree as ET

NS = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
}


def get_cell_lines(cell):
    """擷取 ODT 儲存格內的段落文字清單"""
    lines = []
    for p in cell.findall('.//text:p', NS):
        txt = ''.join(p.itertext()).strip()
        if txt:
            lines.append(txt)
    if not lines:
        txt = ''.join(cell.itertext()).strip()
        if txt:
            lines.append(txt)
    return lines


def extract_codes(scope_text, category):
    """從適用範圍文字中擷取 CCC Code 或 4 碼行業標準分類碼"""
    codes = []
    seen = set()
    if category == 'service':
        # 擷取 4 碼行業分類碼 (例如 5290, 8610 等)
        matches = re.findall(r'\b(\d{4})\b', scope_text)
        for m in matches:
            if m not in seen and not (1990 <= int(m) <= 2035):
                seen.add(m)
                codes.append(m)
    else:
        # 擷取 CCC Code (例如 8714.96, 48237000002, 2517.41.00.00-3 等)
        matches = re.findall(r'\b(\d{4}(?:\.\d{2,4})+(?:-\d)?|\d{6,11}(?:-\d)?)\b', scope_text)
        for m in matches:
            if m not in seen:
                seen.add(m)
                codes.append(m)
    return codes


def classify_category(name, scope):
    """判定商品型 (goods)、服務型 (service) 或其他 (other)"""
    if '服務' in name or '行業標準分類' in scope or '服務適用範圍' in scope:
        return 'service'
    if 'CCC' in scope.upper() or '進出口貨品分類' in scope or '貨品分類號列' in scope or '稅則' in scope:
        return 'goods'
    return 'other'


def convert_odt_to_json(odt_path, json_path, ref_date=None):
    if ref_date is None:
        ref_date = date.today()

    if not os.path.exists(odt_path):
        raise FileNotFoundError(f"找不到 ODT 檔案：{odt_path}")

    with zipfile.ZipFile(odt_path, 'r') as z:
        xml_content = z.read('content.xml')

    root = ET.fromstring(xml_content)
    rows = root.findall('.//table:table-row', NS)

    records = []
    for row in rows[1:]:  # 跳過標題列
        cells = row.findall('table:table-cell', NS)
        if len(cells) < 7:
            continue

        seq_lines = get_cell_lines(cells[0])
        if not seq_lines or not seq_lines[0].isdigit():
            continue
        seq = int(seq_lines[0])

        src_type_lines = get_cell_lines(cells[1])
        if len(src_type_lines) >= 2:
            source, pcr_type = src_type_lines[0], src_type_lines[1]
        elif len(src_type_lines) == 1:
            m = re.match(r'^(環境部|產發署|經濟部工業局|環保署)(.+)$', src_type_lines[0])
            source = m.group(1) if m else '環境部'
            pcr_type = m.group(2).strip() if m else src_type_lines[0]
        else:
            source, pcr_type = '環境部', 'CFP-PCR'

        name_no_lines = get_cell_lines(cells[2])
        if len(name_no_lines) >= 2:
            pcr_no = name_no_lines[-1].strip()
            name = ''.join(name_no_lines[:-1]).strip()
        elif len(name_no_lines) == 1:
            m = re.match(r'^(.+?)([A-Za-z0-9\-]+)$', name_no_lines[0])
            name = m.group(1).strip() if m else name_no_lines[0]
            pcr_no = m.group(2).strip() if m else ''
        else:
            name, pcr_no = '', ''

        applicant = '；'.join(get_cell_lines(cells[3]))
        version = ''.join(get_cell_lines(cells[4]))

        date_lines = get_cell_lines(cells[5])
        approved_date = date_lines[0] if len(date_lines) >= 1 else ''
        expiry_date = date_lines[1] if len(date_lines) >= 2 else '無有效期限'

        scope = '\n'.join(get_cell_lines(cells[6]))

        is_no_expiry = ('無有效期限' in expiry_date)
        days_to_expiry = None
        status = 'active'

        if not is_no_expiry:
            try:
                exp_dt = datetime.strptime(expiry_date.strip(), '%Y/%m/%d').date()
                delta = (exp_dt - ref_date).days
                if delta < 0:
                    status = 'expired'
                elif delta <= 90:
                    status = 'expiring_soon'
                    days_to_expiry = delta
                else:
                    status = 'active'
                    days_to_expiry = delta
            except ValueError:
                status = 'active'

        category = classify_category(name, scope)
        codes = extract_codes(scope, category)

        records.append({
            'seq': seq,
            'pcr_no': pcr_no,
            'name': name,
            'source': source,
            'pcr_type': pcr_type,
            'applicant': applicant,
            'version': version,
            'approved_date': approved_date,
            'expiry_date': expiry_date,
            'is_no_expiry': is_no_expiry,
            'status': status,
            'days_to_expiry': days_to_expiry,
            'category': category,
            'codes': codes,
            'scope': scope,
            'has_dual_track': False,
            'dual_track_note': ''
        })

    # 偵測有效規則中之同名雙軌項目
    active_by_name = {}
    for r in records:
        if r['status'] in ('active', 'expiring_soon'):
            active_by_name.setdefault(r['name'], []).append(r)

    dual_track_items = []
    for name, group in active_by_name.items():
        if len(group) > 1:
            dual_track_items.append(name)
            tracks_desc = ' / '.join([f"{g['pcr_type']}({g['pcr_no']})" for g in group])
            note = f"本品項同時存在多軌有效規則：{tracks_desc}，請依申請標籤或盤查目的擇一適用。"
            for g in group:
                g['has_dual_track'] = True
                g['dual_track_note'] = note

    active_records = [r for r in records if r['status'] in ('active', 'expiring_soon')]
    expiring_records = [r for r in records if r['status'] == 'expiring_soon']
    expired_records = [r for r in records if r['status'] == 'expired']

    active_by_type = {}
    active_by_category = {'service': 0, 'goods': 0, 'other': 0}
    for r in active_records:
        key = f"{r['source']} {r['pcr_type']}".strip()
        active_by_type[key] = active_by_type.get(key, 0) + 1
        cat = r['category'] if r['category'] in active_by_category else 'other'
        active_by_category[cat] += 1

    output_data = {
        'metadata': {
            'source_file': os.path.basename(odt_path),
            'source_url': 'https://cfp.moenv.gov.tw/Carbon/WebPage/FLPCRDoneList.aspx',
            'generated_at': ref_date.strftime('%Y-%m-%d'),
            'total_count': len(records),
            'active_count': len(active_records),
            'expiring_soon_count': len(expiring_records),
            'expired_count': len(expired_records),
            'active_by_type': active_by_type,
            'active_by_category': active_by_category,
            'dual_track_items': dual_track_items
        },
        'records': records
    }

    os.makedirs(os.path.dirname(os.path.abspath(json_path)), exist_ok=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"[完成] 成功轉換 {len(records)} 筆 PCR 資料至 {json_path}")
    print(f"       現行有效：{len(active_records)} 筆（含即將到期 {len(expiring_records)} 筆）、已過期：{len(expired_records)} 筆")


if __name__ == '__main__':
    in_odt = sys.argv[1] if len(sys.argv) > 1 else '已制訂PCR清單.odt'
    out_json = sys.argv[2] if len(sys.argv) > 2 else os.path.join('data', 'pcr_list.json')
    convert_odt_to_json(in_odt, out_json)
