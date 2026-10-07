import os

parts = [
    'sections/part1_styles.html',
    'sections/part2_header_hero.html',
    'sections/part3_services.html',
    'sections/part4_studio_order.html',
    'sections/part5_strip_testimonials_footer.html',
    'sections/part6_modals.html',
    'sections/part7_scripts.html'
]

combined = ''
for p in parts:
    with open(p, 'r', encoding='utf-8') as f:
        combined += f.read() + '\n'

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(combined)

print("index.html assembled successfully! Total size:", len(combined), "bytes")
