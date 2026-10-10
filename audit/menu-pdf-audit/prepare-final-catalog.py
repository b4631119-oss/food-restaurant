#!/usr/bin/env python3
"""Build the reviewed menu catalog and product-photo assets from the PDF audit checkpoints."""
import csv
import json
import re
import shutil
import unicodedata
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
AUDIT = Path(__file__).resolve().parent
EXTRACTED = AUDIT / "extracted"
PHOTO_DIR = ROOT / "public/images/menu/pdf"
SOURCE = "меню сушибар (1).pdf"
PARTS = [AUDIT / f"catalog-p{start:02d}-{end:02d}.json" for start, end in [(1, 5), (6, 10), (11, 15), (16, 20)]]
CATEGORY = {
    1: "фирменные чаи", 2: "Салаттар", 3: "суптар", 4: "вок тамактар",
    5: "гарнирлер", 6: "пицца", 7: "роллдор", 8: "мини роллдор",
    9: "запеченные роллы", 10: "куурулган роллдор", 11: "десерт",
    12: "тез татым / шаурмалар", 13: "тез татым / бургерлер",
    14: "тез татым / гамбургер / хотдог", 15: "сет наборлор", 16: "комбо наборлор",
}
PAGE_ORDER = {2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
              11: 9, 12: 9, 13: 10, 14: 11, 15: 12, 16: 13, 17: 14, 18: 15, 19: 16}
CYRILLIC = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюя", ["a","b","v","g","d","e","yo","zh","z","i","y","k","l","m","n","o","p","r","s","t","u","f","kh","ts","ch","sh","shch","","y","","e","yu","ya"]))
CYRILLIC.update({"ң": "n", "ү": "u", "ө": "o", "қ": "k", "ғ": "g"})
PHOTO_SOURCES = {"наггетсы":"img-006-035.jpg", "чикен кисло-сладкий острый":"img-006-036.jpg",
                 "фри":"img-006-034.jpg", "мини ролл куриный":"img-009-068.jpg"}

def slug(text):
    text = "".join(CYRILLIC.get(ch, ch) for ch in text.lower())
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text)).strip("-") or "item"

def load_rows():
    groups = {order: [] for order in CATEGORY}
    for part in PARTS:
        data = json.loads(part.read_text(encoding="utf-8"))
        for section in data["categories"]:
            order = PAGE_ORDER[section["page"]]
            groups[order].extend(section["items"])
    # The four tea photographs were visible in the original page but absent from the first OCR manifest.
    tea_photos = [3, 4, 5, 6, 7]
    for item, image_num in zip(groups[1], tea_photos):
        item["photo"] = {"pdfPage": 2, "sourceCandidates": [f"img-002-{image_num:03d}.jpg"], "status": "visually-confirmed-in-pdf"}
    # Both ramen names share the ingredient text and the single ramen photograph printed on page 4.
    ramen_description = "лапша, сыр, бульон, яйцо, зелень, кунжут, острый"
    for item in groups[3]:
        if item["name"] in ("рамен тоок эти менен", "рамен мал эти менен"):
            item["description"] = ramen_description
            item["photo"] = {"pdfPage": 4, "sourceCandidates": ["img-004-021.jpg"], "status": "shared-photo-and-composition-visually-confirmed"}
    # Page 6's printed table supplies both product families' full size/price sets.
    side = groups[5]
    nuggets = next(x for x in side if x["name"] == "наггетсы")
    nuggets["variants"] = [
        {"label": f"{grams} г · {flavour}", "weight": f"{grams} г", "price": price}
        for grams, price in [(200,220),(300,320),(500,520)]
        for flavour in ["не острые", "острые"]
    ]
    nuggets["flavourOptions"] = ["не острые", "острые"]
    nuggets["status"] = "portion-price-and-spice-choice-visually-confirmed"
    chicken = next(x for x in side if x["name"] == "чикен кисло-сладкий острый")
    chicken["variants"] = [{"label": f"{grams} г", "weight": f"{grams} г", "price": price} for grams, price in [(200,220),(300,320),(500,520)]]
    # Bilingual labels and the aligned size-price table are visually legible on page 7.
    pizza = groups[6]
    sizes = {
        "мясной ассорти": [("28см",380),("35см",580)],
        "эт менен мясная": [("28см",350),("35см",550)],
        "пепперони": [("28см",320),("35см",500)],
        "4 мезгил": [("28см",350),("35см",550)],
        "4 сыра": [("28см",400),("35см",560)],
        "тоок эти менен курица с грибами": [("28см",350),("35см",550)],
        "маргарита": [("28см",300),("35см",450)],
    }
    for item in pizza:
        item["variants"] = [{"label": size, "weight": size, "price": price} for size, price in sizes[item["name"]]]
    # Page 9 shows four baked mini rolls; OCR checkpoint missed the chicken row.
    groups[8].append({"name":"мини ролл куриный", "description":None, "price":200, "weight":None, "options":[],
                      "photo":{"pdfPage":9,"sourceCandidates":["img-009-069.jpg"],"status":"visually-confirmed-baked-chicken-mini-roll"},
                      "status":"visually-transcribed-from-page-9"})
    # Page 5 visibly prints the chicken rice description separately from the beef description.
    for item in groups[4]:
        if item["name"] == "гуруч тоок эти менен":
            item["description"] = "рис с курицей, паприка, морковь, кабачки, терияки соус, кунжут, зелень"
            item["status"] = "visually-verified-from-page-5"
    # Page 15 shows three "двойной" rows directly below their parent shawarma; attach each as a variant.
    shawarma = groups[12]
    merged = []
    for item in shawarma:
        if item["name"] == "двойной":
            parent = merged[-1]
            parent.setdefault("variants", [{"label":"обычная", "weight":None, "price":parent["price"]}])
            parent["variants"].append({"label":"двойной", "weight":None, "price":item["price"]})
            continue
        merged.append(item)
    # The third «двойной» line visually belongs to baked shawarma; first two belong to beef/chicken shawarma.
    # Twister is its own printed product, separate from assorted shawarma.
    if len(merged) == 6:
        merged[2]["variants"] = [{"label":"обычная", "weight":None, "price":merged[2]["price"]}]
        merged[3]["variants"] = [{"label":"обычная", "weight":None, "price":merged[3]["price"]}, {"label":"двойной", "weight":None, "price":320}]
        merged[4]["name"] = "твистер"
        merged[4]["price"] = 230
        merged.pop(5)
    groups[12] = merged
    # Page 17: both burgers list the same topping choice and one price; keep price common and option textual.
    for item in groups[14]:
        if item["name"] in ("гамбургер", "гамбургер двойной"):
            item["status"] = "visually-confirmed-common-price-with-chicken-or-beef-choice"
    # Source spellings and discrepancies are retained verbatim; they are not editorially corrected.
    for order, items in groups.items():
        for item in items:
            photo = item.get("photo") or {}
            item["sourcePage"] = photo.get("pdfPage") or next((p for p,o in PAGE_ORDER.items() if o == order), None)
            item["sourceName"] = item["name"]
            if order == 4 and item["name"] == "гуруч тоок эти менен":
                item["status"] = "visually-verified-from-page-5"
            if item["name"] == "запеченные миди":
                item["status"] = "manual-review: no price printed/readable; excluded from orderable import"
            if item["name"] == "комбо эки дос":
                item["status"] += "; source spelling 'меди' needs confirmation"
            if item["name"] == "Сэт №4":
                item["status"] += "; preserve printed/OCR spelling 'угар' pending owner spelling check"
    return groups

def photo_num(item, order):
    # Composite spreads on pages 18 and 19 each depict exactly the adjacent numbered set/combo.
    if order == 15:
        return [125,127,129,131][item["_position"]]
    if order == 16:
        return [135,137,139,141][item["_position"]]
    photo = item.get("photo") or {}
    candidates = photo.get("sourceCandidates") or []
    if not candidates:
        return None
    candidate = candidates[0]
    match = re.search(r"-(\d{3})\.(?:jpg|ppm)$", candidate)
    return int(match.group(1)) if match else None

def make_photo(num, product_id):
    source = EXTRACTED / f"img-{num:03d}.jpg"
    if not source.exists():
        return None
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    output = PHOTO_DIR / f"{product_id}.webp"
    with Image.open(source) as original:
        rgb = original.convert("RGB")
        mask_path = EXTRACTED / f"img-{num:03d}.ppm"
        if mask_path.exists():
            with Image.open(mask_path) as mask:
                alpha = mask.convert("L")
                if alpha.size == rgb.size:
                    rgb.putalpha(alpha)
        rgb.save(output, "WEBP", quality=88, method=6)
    return "/images/menu/pdf/" + output.name

def main():
    groups = load_rows()
    categories = []
    catalog_items = []
    import_products = []
    photos = []
    reviews = []
    for order, name in CATEGORY.items():
        items = groups[order]
        categories.append({"name":name, "order":order, "page":next(p for p,o in PAGE_ORDER.items() if o==order), "itemCount":len(items)})
        for pos, item in enumerate(items):
            item["category"] = name
            item["categoryOrder"] = order
            item["_position"] = pos
            base = f"menu-{order:02d}-{slug(item['name'])}"
            # Reserve suffixes for same-name rows in the same section without relying on Firestore auto-IDs.
            same = [x for x in items[:pos] if x["name"] == item["name"]]
            product_id = base + (f"-{len(same)+1}" if same else "")
            num = photo_num(item, order)
            photo_source = PHOTO_SOURCES.get(item["name"])
            if photo_source:
                match = re.search(r"-(\d{3})\.(?:jpg|ppm)$", photo_source)
                num = int(match.group(1)) if match else num
            if item["name"] == "фри":
                num = 46
            item["photo"] = {"path":None,"pdfPage":item.get("sourcePage"),"sourceImage":num,
                             "source":"attached PDF; embedded image object","license":"provided source PDF; no external image",
                             "status":"no-confirmed-match"}
            if num is not None:
                item["photo"]["path"] = make_photo(num, product_id)
                item["photo"]["status"] = "visually-confirmed-page-photo" if order not in (8,) else "same-page-composite-for-variant-family"
            if photo_source and item["photo"]["path"]:
                item["photo"]["status"] = "visually-confirmed-page-photo"
            if item.get("status", "").startswith("manual-review") or item.get("price") is None and not item.get("variants"):
                reviews.append({"category":name,"name":item["name"],"page":item.get("sourcePage"),"status":item.get("status"),"price":item.get("price")})
            item.pop("_position",None)
            catalog_items.append(item)
            variants = item.get("variants") or ([{"label":None,"weight":item.get("weight"),"price":item.get("price")}] if item.get("price") is not None else [])
            item["siteVariants"] = [{"id": slug(v.get("label") or "single"), "label": v.get("label") or "", "name": item["name"], "price": v["price"], "weight": v.get("weight") or item.get("weight") or ""} for v in variants]
            item["importProductIds"] = []
            # The PDF's spicy/non-spicy note is explicitly a choice independent of nugget portion.
            if item["name"] in ("гамбургер", "гамбургер двойной"):
                variants = [{"label":value,"weight":None,"price":item["price"]} for value in ("курица", "мясо говядины")]
                item["options"] = []
            if item["name"] == "шаурма ассорти":
                variants = [{"label":"обычная", "weight":None,"price":270},{"label":"твистер", "weight":None,"price":230}]
            item["siteVariants"] = [{"id":slug(v.get("label") or "single"),"label":v.get("label") or "","name":item["name"],"price":v["price"],"weight":v.get("weight") or item.get("weight") or ""} for v in variants]
            if item["name"] == "шаурма мал эти менен" and item.get("variants"):
                item["variants"][0]["label"] = "обычная"
                item["siteVariants"] = [{"id":slug(v["label"]),"label":v["label"],"name":item["name"],"price":v["price"],"weight":""} for v in item["variants"]]
                variants = item["variants"]
            if item["name"] == "шаурма тоок эти менен" and item.get("variants"):
                item["variants"][0]["label"] = "обычная"
                item["siteVariants"] = [{"id":slug(v["label"]),"label":v["label"],"name":item["name"],"price":v["price"],"weight":""} for v in item["variants"]]
                variants = item["variants"]
            for variant_index, variant in enumerate(variants):
                price = variant.get("price")
                if price is None or item["name"] == "запеченные миди":
                    continue
                label = variant.get("label")
                variant_id = ("-" + slug(label)) if label else ""
                unique_id = product_id + variant_id
                # The ID is fully determined by source order, title and printed option; importing twice upserts the same document.
                image = item["photo"].get("path") or ""
                import_products.append({"id":unique_id,"name":item["name"],"description":item.get("description") or "",
                    "weight":variant.get("weight",item.get("weight")) or "","variant":label or "","price":price,
                    "variantGroupId":product_id,"variantGroupName":item["name"],"variantLabel":label or "",
                    "category":name,"categoryOrder":order,"image":image,"popular":False,"inStock":True,
                    "itemOrder":pos,"sourcePage":item.get("sourcePage"),"sourceStatus":item.get("status","visually-crosschecked")})
                item["importProductIds"].append(unique_id)
                photos.append({"productId":unique_id,"category":name,"product":item["name"],"variant":label or "",
                    "page":item.get("sourcePage"),"imagePath":image,"sourceImage":num or "","source":"attached PDF",
                    "license":"included in user-provided PDF; no external image/license/hotlink","status":item["photo"]["status"]})
    # Keep new output rows compact for transfer while leaving every source transcript field in catalog-final.json.
    final = {"source":SOURCE,"sourcePages":20,"visualReview":"pages 2-19 inspected; cover p1 and delivery/contact p20 contain no food catalog",
             "categoryCount":len(categories),"catalogProductCount":len(catalog_items),"orderableDocumentCount":len(import_products),
             "categories":categories,"items":catalog_items,"pendingManualReview":reviews}
    (AUDIT/"catalog-final.json").write_text(json.dumps(final,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (AUDIT/"import-products.json").write_text(json.dumps({"source":SOURCE,"categories":categories,"products":import_products},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    with (AUDIT/"image-mapping.csv").open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=list(photos[0].keys()));w.writeheader();w.writerows(photos)
    (AUDIT/"manual-review.json").write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"categories":len(categories),"catalogRoots":len(catalog_items),"orderableDocuments":len(import_products),
                      "pendingReview":reviews,"imageFiles":len(list(PHOTO_DIR.glob("*.webp")))},ensure_ascii=False,indent=2))

if __name__ == "__main__": main()
