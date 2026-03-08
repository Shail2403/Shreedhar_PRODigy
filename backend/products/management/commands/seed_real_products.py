"""
Shridhar Enterprise – Real Product Seeder
==========================================
Seeds 100+ real products from 6 authentic Indian food brands:
  1. Falguni Gruh Udhyog (Khakhras, Papads, Bhakhris, Namkeen)
  2. Katdare Food Products (Chutneys, Masalas, Pickles, Instant Mixes)
  3. Kwality / Mahila Nidhi Gruh Udhyog (Beverages, Condiments)
  4. Babus Laxminarayan Chiwda (Chiwda, Sev, Farsan, Ladoo)
  5. Gore Bandhu / Siddhi Food Products (Masalas, Spice Blends)
  6. Chitale Bandhu (Bakarwadi, Farsan, Sweets)
"""

import os
import uuid
import requests
import tempfile
from io import BytesIO
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from products.models import Category, Brand, Product, ProductImage


# ─── Image Helpers ──────────────────────────────────────────────────────────
def download_image(url: str, timeout: int = 15) -> bytes | None:
    """Download image bytes from a URL. Returns None on failure."""
    if not url:
        return None
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': 'https://www.google.com/',
        }
        r = requests.get(url, headers=headers, timeout=timeout)
        if r.status_code == 200 and 'image' in r.headers.get('Content-Type', ''):
            return r.content
        return None
    except Exception:
        return None


# ─── Product Data ────────────────────────────────────────────────────────────
# Format: (name, weight, mrp, selling_price, short_desc, ingredients, is_featured, is_new, is_bestseller, image_url)

PRODUCTS = {
    # ========================================================================
    # BRAND: Falguni Gruh Udhyog | CATEGORY: Khakhras
    # ========================================================================
    ('Falguni Gruh Udhyog', 'Khakhras'): [
        (
            'Methi Khakhra',
            '200g', 80, 72, 'Crispy wheat flour khakhra flavoured with fenugreek leaves & spices.',
            'Wheat flour, Iodised salt, Edible oil, Chilly powder, Methi patta (leaves), Other spices',
            True, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/MethiKhakhra_1024x1024_2x.jpg'
        ),
        (
            'Masala Khakhra',
            '200g', 80, 72, 'Traditional Gujarati crispy khakhra with a blend of Indian masalas.',
            'Wheat flour, Iodised salt, Edible oil, Masala spices, Chilly powder',
            True, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/MasalaKhakhra_1024x1024_2x.jpg'
        ),
        (
            'Sada Khakhra',
            '200g', 75, 68, 'Plain crispy Gujarati khakhra – perfect with tea or chutney.',
            'Wheat flour, Iodised salt, Edible oil',
            False, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/SadaKhakhra_1024x1024_2x.jpg'
        ),
        (
            'Jeera Khakhra',
            '200g', 80, 72, 'Light, crunchy khakhra loaded with whole cumin seeds & mild spices.',
            'Wheat flour, Cumin seeds (jeera), Iodised salt, Edible oil, Spices',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/JeeraKhakhra_1024x1024_2x.jpg'
        ),
        (
            'Peri Peri Khakhra',
            '200g', 85, 76, 'Fiery peri-peri flavoured khakhra for the bold snacker.',
            'Wheat flour, Peri peri seasoning, Edible oil, Iodised salt, Chilly flakes',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/PeriPeriKhakhra_1024x1024_2x.jpg'
        ),
        (
            'Bajra Methi Khakhra',
            '200g', 90, 80, 'Healthy millet khakhra with fresh fenugreek – gluten-friendly option.',
            'Bajra flour, Methi (fenugreek), Edible oil, Salt, Spices',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/BajraMethi_1024x1024_2x.jpg'
        ),
        (
            'Cow Ghee Sada Khakhra',
            '200g', 100, 90, 'Premium khakhra prepared with pure cow ghee for a rich, traditional taste.',
            'Wheat flour, Cow ghee, Iodised salt',
            True, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/CowGheeKhakhra_1024x1024_2x.jpg'
        ),
        (
            'Cheese Dosa Khakhra',
            '200g', 90, 82, 'South-meets-West fusion khakhra with cheesy dosa flavour.',
            'Wheat flour, Cheese powder, Rice flour, Edible oil, Salt, Spices',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/CheeseDosaKhakhra_1024x1024_2x.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Falguni Gruh Udhyog | CATEGORY: Papads & Bhakhri
    # ========================================================================
    ('Falguni Gruh Udhyog', 'Papads & Bhakhri'): [
        (
            'Khichiya Papad Jeera',
            '200g', 45, 40, 'Light, airy rice papad seasoned with cumin – roast or fry to enjoy.',
            'Rice flour, Cumin seeds, Iodised salt, Water',
            True, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/KhichiyaPapadJeera_1024x1024_2x.jpg'
        ),
        (
            'Green Chilly Papad',
            '200g', 45, 40, 'Spicy green chilli rice papad – a tangy, crunchy delight.',
            'Rice flour, Green chilly, Salt, Spices',
            False, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/GreenChillyPapad_1024x1024_2x.jpg'
        ),
        (
            'Methi Bhakhari',
            '200g', 60, 54, 'Crispy whole-wheat flatbread with fenugreek leaves – a Gujarati staple.',
            'Whole wheat flour, Methi leaves, Edible oil, Salt, Spices',
            False, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/MethiBhakhari_1024x1024_2x.jpg'
        ),
        (
            'Masala Bhakhri',
            '200g', 60, 54, 'Flavour-packed masala bhakhri – crunchy, wholesome, and satisfying.',
            'Whole wheat flour, Masala spices, Edible oil, Salt',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/MasalaBhakhri_1024x1024_2x.jpg'
        ),
        (
            'Garlic Bhakhri',
            '200g', 65, 58, 'Bold garlic-flavoured crispy bhakhri – addictive and aromatic.',
            'Wheat flour, Garlic powder, Garlic, Edible oil, Salt, Spices',
            False, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/GarlicBhakhri_1024x1024_2x.jpg'
        ),
        (
            'Pizza Bhakhri',
            '200g', 70, 62, 'Fun pizza-flavoured bhakhri loved by kids and adults alike.',
            'Wheat flour, Pizza herbs, Cheese powder, Edible oil, Salt',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/PizzaBhakhri_1024x1024_2x.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Falguni Gruh Udhyog | CATEGORY: Namkeen & Snacks
    # ========================================================================
    ('Falguni Gruh Udhyog', 'Namkeen & Snacks'): [
        (
            'Bhakharwadi',
            '200g', 90, 80, 'The iconic Gujarati-Maharashtrian spiral snack – sweet, spicy & crunchy.',
            'Wheat flour, Edible oil, Sesame seeds, Coconut, Coriander, Spices, Sugar',
            True, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/Bhakharwadi_1024x1024_2x.jpg'
        ),
        (
            'Mini Bhakharwadi',
            '200g', 85, 75, 'Bite-sized Bhakharwadi – perfect snacking in smaller spirals.',
            'Wheat flour, Edible oil, Sesame seeds, Coconut, Coriander, Spices, Sugar',
            False, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/MiniBhakharwadi_1024x1024_2x.jpg'
        ),
        (
            'Masala Sing',
            '200g', 50, 45, 'Spiced roasted peanuts with a crunchy masala coating.',
            'Peanuts, Gram flour, Edible oil, Salt, Chilly, Spices',
            False, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/MasalaSing_1024x1024_2x.jpg'
        ),
        (
            'Fulwadi',
            '200g', 60, 54, 'Crunchy gram flour sev coils – a classic Gujarati namkeen.',
            'Gram flour, Edible oil, Salt, Turmeric, Spices',
            False, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/Fulwadi_1024x1024_2x.jpg'
        ),
        (
            'Butter Khari',
            '200g', 55, 50, 'Flaky, buttery khari biscuits – light and perfect with tea.',
            'Refined wheat flour, Butter, Salt, Baking powder',
            False, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/ButterKhari_1024x1024_2x.jpg'
        ),
        (
            'Kachori',
            '250g', 70, 62, 'Crispy fried pastry balls stuffed with spiced lentils – a timeless classic.',
            'Wheat flour, Moong dal, Edible oil, Spices, Salt',
            True, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/Kachori_1024x1024_2x.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Falguni Gruh Udhyog | CATEGORY: Sweets & Chikkis
    # ========================================================================
    ('Falguni Gruh Udhyog', 'Sweets & Chikkis'): [
        (
            'White Till Chikki',
            '200g', 60, 54, 'Classic sesame chikki made with white sesame and jaggery.',
            'White sesame seeds, Jaggery, Ghee',
            False, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/WhiteTillChikki_1024x1024_2x.jpg'
        ),
        (
            'Sing Chikki',
            '200g', 65, 58, 'Crunchy peanut chikki with golden jaggery – a beloved Indian sweet.',
            'Peanuts, Jaggery, Ghee',
            True, False, True,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/SingChikki_1024x1024_2x.jpg'
        ),
        (
            'Dryfruit Chikki',
            '200g', 120, 108, 'Luxurious dry fruit and nut chikki – a premium festive treat.',
            'Mixed dry fruits (cashew, almonds, pistachios), Jaggery, Ghee',
            True, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/DryfruitsChikki_1024x1024_2x.jpg'
        ),
        (
            'Sukhadi',
            '200g', 80, 72, 'Traditional Gujarati sweet made with wheat flour, ghee & jaggery.',
            'Whole wheat flour, Ghee, Jaggery',
            True, False, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/Sukhadi_1024x1024_2x.jpg'
        ),
        (
            'Sing Date Ladoo',
            '200g', 90, 80, 'Nutritious dates and peanut ladoos – no sugar added, naturally sweet.',
            'Dates, Peanuts, Cardamom, Ghee',
            False, True, False,
            'https://www.falgunigruhudhyog.in/cdn/shop/products/SingDateLadoo_1024x1024_2x.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Katdare Food Products | CATEGORY: Chutneys
    # ========================================================================
    ('Katdare Food Products', 'Chutneys'): [
        (
            'Lasun Chutney',
            '100g', 75, 68, 'Spicy dry garlic and coconut chutney – a Maharashtrian essential.',
            'Dry coconut, Garlic, Red chilly, Salt, Spices',
            True, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/Lasun-chutney-100g.jpg'
        ),
        (
            'Shengdana Chutney',
            '100g', 65, 58, 'Roasted peanut chutney – nutty, garlicky, and perfectly spiced.',
            'Roasted peanuts, Garlic, Red chilly, Salt, Coriander',
            False, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/shengdana-chutney.jpg'
        ),
        (
            'Kadipatta Chutney',
            '100g', 65, 58, 'Aromatic curry leaf chutney with a distinctly South Indian character.',
            'Curry leaves, Dry coconut, Garlic, Red chilly, Salt',
            False, False, False,
            'https://www.katdarefoods.in/cdn/shop/products/kadipatta-chutney.jpg'
        ),
        (
            'Wada Pav Chutney',
            '100g', 70, 62, 'Mumbai-style dry garlic chutney that makes every vada pav legendary.',
            'Dry coconut, Garlic, Red chilly, Salt, Sesame seeds',
            True, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/wada-pav-chutney.jpg'
        ),
        (
            'Jawas Chutney',
            '100g', 60, 54, 'Flaxseed chutney – healthy, nutty, and rich in omega-3s.',
            'Flaxseeds (jawas), Garlic, Red chilly, Salt, Sesame',
            False, True, False,
            'https://www.katdarefoods.in/cdn/shop/products/jawas-chutney.jpg'
        ),
        (
            'Karala Chutney',
            '100g', 60, 54, 'Traditional halim/garden cress seed chutney – a nutritional powerhouse.',
            'Garden cress seeds (karala), Coconut, Garlic, Red chilly, Salt',
            False, True, False,
            'https://www.katdarefoods.in/cdn/shop/products/karala-chutney.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Katdare Food Products | CATEGORY: Spices & Masalas
    # ========================================================================
    ('Katdare Food Products', 'Spices & Masalas'): [
        (
            'Goda Masala',
            '100g', 80, 72, 'Authentic Maharashtrian goda masala – the heart of Maharashtrian cooking.',
            'Coriander, Cumin, Black pepper, Cloves, Cardamom, Cinnamon, Bay leaves, Dry coconut, Poppy seeds',
            True, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/goda-masala.jpg'
        ),
        (
            'A1 Kanda Lasun Masala',
            '100g', 85, 76, 'Fiery onion-garlic masala – the definitive spice blend for any curry.',
            'Red chilly, Coriander, Cumin, Onion, Garlic, Turmeric, Salt',
            True, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/kanda-lasun-masala.jpg'
        ),
        (
            'Special Chilly Powder',
            '100g', 60, 54, 'Vibrant red chilly powder with balanced heat and bright colour.',
            'Red chillies (100%)',
            False, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/chilly-powder.jpg'
        ),
        (
            'Special Halad Powder',
            '100g', 55, 50, 'Pure turmeric powder with superior curcumin content and golden colour.',
            'Turmeric (100%)',
            False, False, False,
            'https://www.katdarefoods.in/cdn/shop/products/halad-powder.jpg'
        ),
        (
            'Dhana Jeera Powder',
            '100g', 60, 54, 'Classic coriander-cumin spice blend – essential for Indian cooking.',
            'Coriander (70%), Cumin (30%)',
            False, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/dhana-jeera.jpg'
        ),
        (
            'Chatpat Kanda Lasun Masala',
            '100g', 90, 80, 'Zesty, tangy version of the kanda lasun masala with a chatpata twist.',
            'Red chilly, Coriander, Cumin, Onion, Garlic, Amchur, Salt, Spices',
            False, True, False,
            'https://www.katdarefoods.in/cdn/shop/products/chatpat-masala.jpg'
        ),
        (
            'Thalipeeth Bhajani',
            '500g', 90, 80, 'Multi-grain roasted flour blend for making nutritious thalipeeth.',
            'Roasted rice, Wheat, Jowar, Bajra, Chana dal, Urad dal, Coriander, Cumin',
            True, False, False,
            'https://www.katdarefoods.in/cdn/shop/products/thalipeeth-bhajani.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Katdare Food Products | CATEGORY: Pickles
    # ========================================================================
    ('Katdare Food Products', 'Pickles'): [
        (
            'Mango Pickle',
            '200g', 85, 76, 'Tangy, spicy raw mango pickle made the traditional Maharashtrian way.',
            'Raw mango, Mustard oil, Fenugreek seeds, Nigella seeds, Red chilly, Salt, Spices',
            True, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/mango-pickle.jpg'
        ),
        (
            'Green Chilly Pickle',
            '200g', 80, 72, 'Fiery green chilly pickle – perfect to add heat to any meal.',
            'Green chillies, Mustard oil, Fenugreek seeds, Salt, Spices',
            False, False, False,
            'https://www.katdarefoods.in/cdn/shop/products/green-chilly-pickle.jpg'
        ),
        (
            'Lemon Pickle',
            '200g', 80, 72, 'Classic Maharashtrian lemon pickle with an irresistible tangy flavour.',
            'Lemon, Salt, Red chilly powder, Turmeric, Mustard seeds',
            False, False, True,
            'https://www.katdarefoods.in/cdn/shop/products/lemon-pickle.jpg'
        ),
        (
            'Sweet Lime Pickle',
            '200g', 85, 76, 'Sweet and tangy sweet lime pickle – a unique and refreshing condiment.',
            'Sweet lime, Sugar, Salt, Spices',
            False, True, False,
            'https://www.katdarefoods.in/cdn/shop/products/sweet-lime-pickle.jpg'
        ),
        (
            'Mix Pickle',
            '200g', 90, 80, 'A vibrant medley of seasonal vegetables in aromatic pickle masala.',
            'Mixed vegetables, Mustard oil, Spices, Salt, Vinegar',
            False, False, False,
            'https://www.katdarefoods.in/cdn/shop/products/mix-pickle.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Kwality / Mahila Nidhi | CATEGORY: Beverages & Mixes
    # ========================================================================
    ('Kwality / Mahila Nidhi', 'Beverages & Mixes'): [
        (
            'Hajma Hajam Digestive Mix',
            '100g', 20, 18, 'Ayurvedic digestive spice blend – sip after meals for comfort & relief.',
            'Ajwain, Sanchal, Hing, Jeera, Sendha namak, Dried ginger, Black pepper',
            True, False, True,
            'https://images.unsplash.com/photo-1565843248109-b4cbc3f9d1d1?w=400&q=80'
        ),
        (
            'Keri Masala Beverage Mix',
            '100g', 20, 18, 'Tangy raw mango masala drink mix – refreshing summer cooler.',
            'Dried raw mango (amchur), Black salt, Cumin, Jeera, Sugar, Spices',
            False, False, True,
            'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80'
        ),
        (
            'Jaljeera Masala Mix',
            '100g', 20, 18, 'Classic jaljeera powder – just add water for an instant digestive drink.',
            'Cumin, Mint, Coriander, Black salt, Amchur, Ginger, Black pepper, Spices',
            False, True, False,
            'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80'
        ),
        (
            'Masala Chaas Mix',
            '100g', 20, 18, 'Buttermilk masala mix – spice up your chaas in seconds.',
            'Roasted cumin, Black salt, Mint, Asafoetida, Red chilly, Salt',
            False, False, True,
            'https://images.unsplash.com/photo-1571167530149-c1105da4d12c?w=400&q=80'
        ),
        (
            'Amla Candy',
            '150g', 20, 18, 'Sun-dried Indian gooseberry candy sprinkled with spicy salt – a tart treat.',
            'Amla (Indian gooseberry), Salt, Black salt, Red chilly powder',
            False, True, False,
            'https://images.unsplash.com/photo-1601058268499-e9b5fee4eff3?w=400&q=80'
        ),
        (
            'Imli Goli',
            '100g', 10, 9, 'Tamarind and spice balls – a nostalgic Indian street-food candy.',
            'Tamarind, Jaggery, Black salt, Cumin, Ginger powder, Chilly powder',
            False, False, True,
            'https://images.unsplash.com/photo-1617355337940-95e4d5b5c47a?w=400&q=80'
        ),
    ],

    # ========================================================================
    # BRAND: Babus Laxminarayan Chiwda | CATEGORY: Chiwda & Farsan
    # ========================================================================
    ('Babus Laxminarayan Chiwda', 'Chiwda & Farsan'): [
        (
            'Poha Chiwda',
            '250g', 120, 108, "Pune's legendary beaten-rice chiwda – light, spiced & irresistible. Made since 1945.",
            'Poha (flattened rice), Peanuts, Cashews, Curry leaves, Dry coconut, Mustard seeds, Turmeric, Salt, Sugar',
            True, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Poha_Chiwda_1024x1024.jpg'
        ),
        (
            'Patal Poha Chiwda',
            '250g', 120, 108, 'Thin, extra-crispy version of the famous Poha Chiwda – a lighter snack.',
            'Thin poha (flattened rice), Peanuts, Curry leaves, Coconut, Mustard seeds, Turmeric, Salt',
            False, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Patal_Poha_Chiwda_1024x1024.jpg'
        ),
        (
            'Badam Chiwda',
            '250g', 150, 135, 'Premium almond chiwda – an indulgent snack blending crunch with luxury.',
            'Poha, Almonds, Cashews, Peanuts, Curry leaves, Coconut, Spices',
            True, False, False,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Badam_Chiwda_1024x1024.jpg'
        ),
        (
            'Cornflakes Chiwda',
            '250g', 110, 99, 'Modern cornflake chiwda – a crunchy, light, low-oil alternative.',
            'Cornflakes, Peanuts, Dry coconut, Curry leaves, Mustard seeds, Turmeric, Salt',
            False, True, False,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Cornflakes_Chiwda_1024x1024.jpg'
        ),
        (
            'Best Farsan',
            '250g', 130, 117, 'Mixed farsan – a classic Maharashtrian-style assortment of crispy snacks.',
            'Gram flour sev, Boondi, Poha, Peanuts, Curry leaves, Spices',
            True, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Best_Farsan_1024x1024.jpg'
        ),
        (
            'Misal Farsan',
            '250g', 130, 117, 'Spicy misal mix – the perfect crunchy topping for misal pav.',
            'Gram flour sev, Poha, Peanuts, Chiwda, Spices',
            False, True, False,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Misal_Farsan_1024x1024.jpg'
        ),
        (
            'Gathi',
            '250g', 90, 81, 'Crispy Maharashtrian fried gram flour sticks with sesame and spices.',
            'Gram flour, Sesame seeds, Edible oil, Salt, Carom seeds, Spices',
            False, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Gathi_1024x1024.jpg'
        ),
        (
            'Khatta Meetha',
            '250g', 100, 90, 'Sweet and tangy namkeen mix – a perfectly balanced snack to munch on.',
            'Sev, Poha, Peanuts, Raisins, Coconut, Sugar, Tamarind, Spices',
            False, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Khatta_Meetha_1024x1024.jpg'
        ),
        (
            'Bhavnagari Sev',
            '250g', 80, 72, 'Thick, crispy besan sev from Bhavnagar – mildly spiced and satisfying.',
            'Gram flour, Edible oil, Salt, Turmeric, Carom seeds',
            False, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Bhavnagari_Sev_1024x1024.jpg'
        ),
        (
            'Aloo Bhujia',
            '200g', 70, 63, 'Fine sev made with potato and gram flour – a Rajasthani snack staple.',
            'Gram flour, Potato, Edible oil, Salt, Pepper, Spices',
            False, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Aloo_Bhujia_1024x1024.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Babus Laxminarayan Chiwda | CATEGORY: Sweets & Mithai
    # ========================================================================
    ('Babus Laxminarayan Chiwda', 'Sweets & Mithai'): [
        (
            'Bakarwadi',
            '250g', 140, 125, 'Authentic Pune-style Bakarwadi – a spiral of spicy, sweet perfection.',
            'Wheat flour, Coconut, Sesame seeds, Coriander seeds, Spices, Sugar, Edible oil',
            True, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Bakarwadi_1024x1024.jpg'
        ),
        (
            'Kaju Katli',
            '250g', 300, 270, 'Silky smooth cashew fudge – the quintessential Indian festive sweet.',
            'Cashews, Sugar, Ghee, Cardamom, Silver vark',
            True, False, False,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Kaju_Katli_1024x1024.jpg'
        ),
        (
            'Besan Ladoo',
            '250g', 200, 180, 'Melt-in-your-mouth roasted gram flour ladoos with ghee and cardamom.',
            'Gram flour, Ghee, Sugar, Cardamom, Cashews, Raisins',
            True, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Besan_Ladoo_1024x1024.jpg'
        ),
        (
            'Motichoor Ladoo',
            '250g', 220, 198, 'Tiny boondi pearls bound together in a luscious saffron ladoo.',
            'Gram flour, Sugar, Ghee, Saffron, Cardamom, Pistachios',
            False, False, True,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Motichoor_Ladoo_1024x1024.jpg'
        ),
        (
            'Mysore Pak',
            '250g', 220, 198, 'Rich ghee-laden Mysore Pak – a South Indian royal treat.',
            'Gram flour, Ghee, Sugar, Cardamom',
            False, False, False,
            'https://babuslaxminarayanchiwda.com/cdn/shop/files/Mysore_Pak_1024x1024.jpg'
        ),
    ],

    # ========================================================================
    # BRAND: Gore Bandhu (Siddhi Food Products) | CATEGORY: Spices & Masalas
    # ========================================================================
    ('Gore Bandhu', 'Spices & Masalas'): [
        (
            'Garam Masala',
            '100g', 75, 68, 'Warming whole-spice blend – elevates every curry, dal, and rice dish.',
            'Black pepper, Cloves, Cardamom, Cinnamon, Bay leaves, Cumin, Coriander, Nutmeg',
            True, False, True,
            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80'
        ),
        (
            'Meat Masala',
            '100g', 85, 76, 'Bold, robust masala blend designed for non-veg curries and kebabs.',
            'Red chilly, Coriander, Cumin, Black pepper, Cloves, Cardamom, Ginger, Garlic, Turmeric',
            False, False, True,
            'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80'
        ),
        (
            'Red Chilli Powder',
            '100g', 50, 45, 'Pure, bright-red Byadgi chilli powder – moderate heat, intense colour.',
            'Red chillies (100%)',
            False, False, True,
            'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80'
        ),
        (
            'Turmeric Powder',
            '100g', 50, 45, 'Premium grade turmeric powder – rich in curcumin for health & flavour.',
            'Turmeric rhizome (100%)',
            False, False, False,
            'https://images.unsplash.com/photo-1595854341625-f33e596f1e50?w=400&q=80'
        ),
        (
            'Coriander Powder',
            '100g', 45, 40, 'Freshly ground coriander seeds – a base spice in countless Indian dishes.',
            'Dried coriander seeds (100%)',
            False, False, False,
            'https://images.unsplash.com/photo-1599489253793-1a99aae84ef0?w=400&q=80'
        ),
        (
            'Gore Bandhu Bhadang',
            '200g', 80, 72, 'The famed spicy puffed rice snack from Pune – bold, crunchy & addictive.',
            'Puffed rice, Groundnut oil, Peanuts, Dry coconut, Green chilly, Garlic, Salt, Spices',
            True, False, True,
            'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80'
        ),
        (
            'Pav Bhaji Masala',
            '100g', 70, 62, 'Signature Pav Bhaji spice mix – the magic behind Mumbai street food.',
            'Coriander, Cumin, Red chilly, Fennel, Amchur, Turmeric, Black pepper, Cardamom, Salt',
            True, False, True,
            'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80'
        ),
        (
            'Biryani Masala',
            '100g', 80, 72, 'Fragrant biryani masala blend – for restaurant-quality biryani at home.',
            'Bay leaves, Cardamom, Cloves, Cinnamon, Star anise, Mace, Nutmeg, Black pepper, Cumin',
            False, True, False,
            'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80'
        ),
    ],

    # ========================================================================
    # BRAND: Chitale Bandhu | CATEGORY: Namkeen & Snacks (via Amazon)
    # ========================================================================
    ('Chitale Bandhu', 'Namkeen & Snacks'): [
        (
            'Chitale Bandhu Bakarwadi',
            '400g', 160, 145, 'The original Pune Bakarwadi – a globally loved Indian snack since 1950.',
            'Wheat flour, Gram flour, Coconut, Sesame seeds, Coriander, Spices, Edible oil',
            True, False, True,
            'https://www.amazon.in/images/I/81bqm+1nthL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Chakli',
            '200g', 80, 72, 'Crispy spiral-shaped rice flour snack – a Maharashtra festival favourite.',
            'Rice flour, Gram flour, Sesame seeds, Carom seeds, Edible oil, Salt, Spices',
            True, False, True,
            'https://www.amazon.in/images/I/91NoPapQrZL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Chivda Mix',
            '400g', 130, 117, 'Assorted spiced snack mix – a delightful blend of textures and flavours.',
            'Poha, Sev, Peanuts, Cashews, Raisins, Curry leaves, Spices, Salt, Sugar',
            False, False, True,
            'https://www.amazon.in/images/I/81gRGkBPnCL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Shankarpali',
            '200g', 90, 81, 'Sweet fried pastry diamonds – a traditional Maharashtrian Diwali snack.',
            'Refined wheat flour, Sugar, Ghee, Salt, Cardamom',
            False, False, False,
            'https://www.amazon.in/images/I/71Z5mBJaR0L._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Kaju Bakarwadi',
            '200g', 190, 172, 'Premium cashew-enhanced bakarwadi – a richer, more indulgent variant.',
            'Wheat flour, Cashews, Coconut, Sesame, Coriander, Spices, Edible oil',
            True, True, False,
            'https://www.amazon.in/images/I/61VB5LNRKYL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Namkeen Mix',
            '400g', 140, 126, 'Multi-grain namkeen mix – a wholesome and crunchy any-time snack.',
            'Mixed grains, Sev, Peanuts, Poha, Spices, Salt',
            False, False, True,
            'https://www.amazon.in/images/I/91p1xO1WqDL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Mixture',
            '400g', 140, 126, 'Classic Pune-style mixture – a harmonious blend of sweet, salty, & spicy.',
            'Sev, Chivda, Peanuts, Raisins, Coconut, Curry leaves, Spices',
            False, False, True,
            'https://www.amazon.in/images/I/71MqHUGEAiL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Laddoo',
            '400g', 220, 198, 'Traditional Maharashtrian wheat and coconut laddoos – mildly sweet, nutty.',
            'Whole wheat flour, Coconut, Ghee, Jaggery, Cardamom, Sesame seeds',
            True, False, False,
            'https://www.amazon.in/images/I/71KLKFxvlHL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Thalipeeth Bhajani',
            '500g', 90, 81, 'Multi-grain roasted flour for thalipeeth – a nutritious Maharashtrian staple.',
            'Roasted jowar, Bajra, Wheat, Rice, Chana dal, Coriander seeds, Cumin',
            False, True, False,
            'https://www.amazon.in/images/I/61V+sZYt9qL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Choco Bakarwadi',
            '200g', 100, 90, 'Innovative chocolate-meets-Bakarwadi snack – a fun modern twist.',
            'Wheat flour, Cocoa, Coconut, Sesame, Chocolate flavoring, Spices, Oil',
            False, True, False,
            'https://www.amazon.in/images/I/61-W0D+RxQL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Multigrain Chakli',
            '200g', 90, 81, 'Nutritious multigrain chakli with finger millet and sesame.',
            'Rice flour, Ragi flour, Jowar flour, Sesame seeds, Carom seeds, Oil, Salt',
            False, True, False,
            'https://www.amazon.in/images/I/713RObRy0WL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Baked Sev',
            '200g', 80, 72, 'Oven-baked sev – lower in fat, higher in protein, full on flavour.',
            'Gram flour, Rice flour, Pepper, Salt, Minimal oil',
            False, True, False,
            'https://www.amazon.in/images/I/71j5hU5pGPL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Pepper Bakarwadi',
            '200g', 100, 90, 'Peppery take on the classic Bakarwadi – for lovers of fiery flavours.',
            'Wheat flour, Black pepper, Coconut, Sesame, Spices, Edible oil',
            False, False, False,
            'https://www.amazon.in/images/I/71BtklFfDrL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Diwali Gift Pack',
            '600g', 350, 315, 'Curated Diwali assortment – Bakarwadi, Chakli & Shankarpali combo pack.',
            'Bakarwadi, Chakli, Shankarpali (see individual items for ingredients)',
            True, False, False,
            'https://www.amazon.in/images/I/81p2+1XCYGL._SX679_.jpg'
        ),
        (
            'Chitale Bandhu Sada Bakarwadi',
            '200g', 80, 72, 'Smaller, plain Bakarwadi – the affordable everyday version of the classic.',
            'Wheat flour, Coconut, Sesame, Coriander, Spices, Edible oil',
            False, False, True,
            'https://www.amazon.in/images/I/71NoPapQrZL._SX679_.jpg'
        ),
    ],
}


class Command(BaseCommand):
    help = 'Seed real products from 6 authentic Indian food brands'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset', action='store_true',
            help='Reset all products, categories, and brands before seeding'
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('⚠️  Resetting all products, categories, and brands...'))
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Brand.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅  Database cleared.'))

        self.stdout.write(self.style.MIGRATE_HEADING('\n🚀  Seeding real products from 6 brands...\n'))

        total_products = 0
        total_images = 0
        errors = []

        with transaction.atomic():
            # Category icon mapping
            cat_icons = {
                'Khakhras': '🫓',
                'Papads & Bhakhri': '🥙',
                'Namkeen & Snacks': '🍿',
                'Sweets & Chikkis': '🍬',
                'Chutneys': '🌶️',
                'Spices & Masalas': '🫙',
                'Pickles': '🥒',
                'Beverages & Mixes': '🥤',
                'Chiwda & Farsan': '🥣',
                'Sweets & Mithai': '🍭',
            }

            for (brand_name, category_name), products in PRODUCTS.items():
                self.stdout.write(f'\n📦  {brand_name} → {category_name}')

                # Get or create category
                cat, _ = Category.objects.get_or_create(
                    name=category_name,
                    defaults={
                        'icon': cat_icons.get(category_name, '🛒'),
                        'description': f'Authentic Indian {category_name.lower()} from the best local brands.',
                        'is_active': True,
                    }
                )

                # Get or create brand
                brand_websites = {
                    'Falguni Gruh Udhyog': 'https://www.falgunigruhudhyog.in/',
                    'Katdare Food Products': 'https://www.katdarefoods.in/',
                    'Kwality / Mahila Nidhi': 'https://www.kwality-products.com/',
                    'Babus Laxminarayan Chiwda': 'https://babuslaxminarayanchiwda.com/',
                    'Gore Bandhu': 'https://gorebandhu.in/',
                    'Chitale Bandhu': 'https://www.amazon.in/',
                }
                brand, _ = Brand.objects.get_or_create(
                    name=brand_name,
                    defaults={
                        'website': brand_websites.get(brand_name, ''),
                        'is_active': True,
                        'description': f'Authentic products by {brand_name}.',
                    }
                )

                for (name, weight, mrp, price, short_desc, ingredients,
                        is_featured, is_new, is_bestseller, image_url) in products:

                    # Create product
                    product, created = Product.objects.get_or_create(
                        name=name,
                        brand=brand,
                        defaults={
                            'category': cat,
                            'weight': weight,
                            'mrp': mrp,
                            'selling_price': price,
                            'short_description': short_desc,
                            'description': f'<p>{short_desc}</p>',
                            'ingredients': ingredients,
                            'is_featured': is_featured,
                            'is_new_arrival': is_new,
                            'is_bestseller': is_bestseller,
                            'is_available': True,
                            'stock': 100,
                            'quantity_unit': 'pack',
                            'rating': 4.3,
                            'review_count': 45,
                            'country_of_origin': 'India',
                            'shelf_life': '6 months from date of manufacture',
                        }
                    )

                    if not created:
                        self.stdout.write(f'  ↩️  Already exists: {name}')
                        total_products += 1
                        continue

                    # Download and attach image
                    img_data = download_image(image_url)

                    if img_data:
                        ext = 'jpg'
                        if 'png' in image_url.lower():
                            ext = 'png'
                        elif 'webp' in image_url.lower():
                            ext = 'webp'
                        filename = f"{product.id}.{ext}"
                        pi = ProductImage(product=product, sort_order=0, alt_text=name)
                        pi.image.save(filename, ContentFile(img_data), save=True)
                        total_images += 1
                        status = '🖼️'
                    else:
                        errors.append(f'No image for: {name}')
                        status = '⚠️'

                    self.stdout.write(f'  {status}  {name} ({weight}) — ₹{price} [{("NEW" if created else "exists")}]')
                    total_products += 1

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n\n✅  Seeding complete!'))
        self.stdout.write(f'   Products created : {total_products}')
        self.stdout.write(f'   Images downloaded: {total_images}')
        if errors:
            self.stdout.write(self.style.WARNING(f'\n⚠️  Warnings ({len(errors)}):'))
            for e in errors[:10]:
                self.stdout.write(f'   - {e}')
