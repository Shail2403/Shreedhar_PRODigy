"""
Image Patch Command – Attaches curated Unsplash images to products lacking images.
"""
import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from products.models import Product, ProductImage

# Category-level curated Unsplash image pool
CATEGORY_IMAGES = {
    'Khakhras': [
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=600&q=80',
    ],
    'Papads & Bhakhri': [
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
        'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80',
    ],
    'Namkeen & Snacks': [
        'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80',
        'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=600&q=80',
        'https://images.unsplash.com/photo-1604918687855-d0d66e5ec09d?w=600&q=80',
    ],
    'Sweets & Chikkis': [
        'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80',
        'https://images.unsplash.com/photo-1548967090-9b7e4d4ac95b?w=600&q=80',
    ],
    'Chutneys': [
        'https://images.unsplash.com/photo-1598932533090-b5e0e178cadb?w=600&q=80',
        'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80',
    ],
    'Spices & Masalas': [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
        'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    ],
    'Pickles': [
        'https://images.unsplash.com/photo-1613042292369-b6dc72e4beca?w=600&q=80',
        'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&q=80',
    ],
    'Beverages & Mixes': [
        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
        'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&q=80',
    ],
    'Chiwda & Farsan': [
        'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80',
        'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=600&q=80',
        'https://images.unsplash.com/photo-1604918687855-d0d66e5ec09d?w=600&q=80',
    ],
    'Sweets & Mithai': [
        'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80',
        'https://images.unsplash.com/photo-1548967090-9b7e4d4ac95b?w=600&q=80',
        'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80',
    ],
}
DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1585241936939-be4099591252?w=600&q=80'


def download_image(url):
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        if r.status_code == 200 and 'image' in r.headers.get('Content-Type', ''):
            return r.content
    except Exception:
        pass
    return None


class Command(BaseCommand):
    help = 'Patch missing product images using curated Unsplash photos'

    def handle(self, *args, **options):
        products_no_image = [p for p in Product.objects.all() if p.images.count() == 0]
        self.stdout.write(f'📷 {len(products_no_image)} products need images...')

        for idx, product in enumerate(products_no_image):
            cat_name = product.category.name if product.category else 'Namkeen & Snacks'
            pool = CATEGORY_IMAGES.get(cat_name, [DEFAULT_IMAGE])
            url = pool[idx % len(pool)]

            img_data = download_image(url)
            if img_data:
                pi = ProductImage(product=product, sort_order=0, alt_text=product.name)
                pi.image.save(f'{product.id}.jpg', ContentFile(img_data), save=True)
                self.stdout.write(f'  ✅  {product.name}')
            else:
                self.stdout.write(f'  ⚠️  Failed: {product.name}')

        self.stdout.write(self.style.SUCCESS(f'\n✅ Done! Patched {len(products_no_image)} products.'))
