"""Genera los assets de marca de Tamarindo a partir de infoBase.

- Extrae el logotipo del PDF de branding con canal alfa y lo recoloriza.
- Convierte las fotos de WhatsApp a WebP con nombres de producto.
- Compone los banners promocionales con la paleta de marca.
"""

import os
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
INFO = ROOT / "infoBase"
TMP = Path(os.environ.get("TEMP", "/tmp")) / "opencode" / "tamarindo_pdf"
OUT_LOGO = ROOT / "img" / "logo"
OUT_PROD = ROOT / "img" / "productos"
OUT_BANNER = ROOT / "img" / "banners"

CREAM = (246, 235, 226)
ORANGE = (236, 104, 29)
RED = (223, 21, 23)
GREEN = (1, 51, 37)


def extraer_logo_base():
    """Devuelve el logo monocromo verde del PDF como RGBA con fondo transparente."""
    doc = fitz.open(INFO / "Tamarindo_Branding_Opcion4.pdf")
    pagina = doc[2]
    xref = None
    smask = 0
    for img in pagina.get_images(full=True):
        # El xref 14 es el logo completo en verde (el resto son variantes).
        if img[0] == 14:
            xref, smask = img[0], img[1]
            break
    if xref is None:
        raise RuntimeError("No se encontró el logotipo en el PDF de branding")

    pix = fitz.Pixmap(doc, xref)
    if smask:
        pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))
    elif pix.alpha == 0:
        pix = fitz.Pixmap(fitz.csRGB, pix)

    imagen = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples).convert("RGBA")

    # Las zonas negras son el fondo del original: se vuelven transparentes.
    datos = imagen.load()
    for y in range(imagen.height):
        for x in range(imagen.width):
            r, g, b, a = datos[x, y]
            if r < 40 and g < 40 and b < 40:
                datos[x, y] = (0, 0, 0, 0)
    bbox = imagen.getbbox()
    return imagen.crop(bbox) if bbox else imagen


def recolorizar(imagen, color):
    """Reemplaza la tinta del logo por `color`, conservando el antialiasing."""
    salida = imagen.copy()
    datos = salida.load()
    for y in range(salida.height):
        for x in range(salida.width):
            r, g, b, a = datos[x, y]
            if a == 0:
                continue
            # La tinta original es verde profundo; el brillo del antialiasing se conserva.
            brillo = max(r, g, b)
            factor = min(1.0, brillo / 60.0)
            rgb = tuple(int(c * factor) for c in color)
            datos[x, y] = (*rgb, a)
    return salida


def extraer_personaje():
    """Extrae solo el personaje del PDF (xref 15) con fondo transparente."""
    doc = fitz.open(INFO / "Tamarindo_Branding_Opcion4.pdf")
    xref = smask = 0
    for img in doc[2].get_images(full=True):
        if img[0] == 15:
            xref, smask = img[0], img[1]
            break
    if not xref:
        raise RuntimeError("No se encontró el personaje en el PDF de branding")

    pix = fitz.Pixmap(doc, xref)
    if smask:
        pix = fitz.Pixmap(pix, fitz.Pixmap(doc, smask))
    imagen = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples).convert("RGBA")
    datos = imagen.load()
    for y in range(imagen.height):
        for x in range(imagen.width):
            r, g, b, a = datos[x, y]
            if r < 40 and g < 40 and b < 40:
                datos[x, y] = (0, 0, 0, 0)
    bbox = imagen.getbbox()
    return imagen.crop(bbox) if bbox else imagen


def guardar_patron():
    """Tema de personaje + rayo en una sola tinta, según el PDF de branding."""
    personaje = recolorizar(extraer_personaje(), ORANGE)
    personaje.thumbnail((74, 74), Image.LANCZOS)

    tesela = Image.new("RGBA", (240, 240), (0, 0, 0, 0))
    tesela.alpha_composite(personaje, (16, 36))

    dibujo = ImageDraw.Draw(tesela)
    rayo = [(132, 30), (106, 78), (122, 78), (104, 124), (148, 68), (130, 68), (148, 30)]
    dibujo.polygon(rayo, fill=ORANGE)
    tesela.save(OUT_LOGO / "tamarindo-pattern.webp", "WEBP", quality=90, method=6)


def guardar_logos():
    base = extraer_logo_base()
    variantes = {
        "tamarindo-logo.webp": ORANGE,
        "tamarindo-logo-green.webp": GREEN,
        "tamarindo-logo-cream.webp": CREAM,
    }
    for nombre, color in variantes.items():
        recolorizar(base, color).save(OUT_LOGO / nombre, "WEBP", quality=92, method=6)
    recolorizar(base, ORANGE).save(OUT_LOGO / "tamarindo-logo.png", "PNG")

    # Favicon: cuadrado verde con el logo naranja centrado.
    fav = Image.new("RGBA", (512, 512), (*GREEN, 255))
    logo = recolorizar(base, ORANGE)
    escala = min(430 / logo.width, 360 / logo.height)
    logo = logo.resize((int(logo.width * escala), int(logo.height * escala)), Image.LANCZOS)
    fav.alpha_composite(logo, ((512 - logo.width) // 2, (512 - logo.height) // 2))
    fav.convert("RGB").save(OUT_LOGO / "tamarindo-favicon.png", "PNG")


FOTOS = {
    "WhatsApp Image 2026-11-18 at 1.03.12 AM.jpeg": "margherita.webp",
    "WhatsApp Image 2026-11-18 at 1.03.12 AM (1).jpeg": "pepperoni-tamarindo.webp",
    "WhatsApp Image 2026-11-18 at 1.03.12 AM (2).jpeg": "pepperoni-detalle.webp",
    "WhatsApp Image 2026-11-18 at 1.03.13 AM.jpeg": "queso-azul-repollo.webp",
    "WhatsApp Image 2026-11-18 at 1.03.13 AM (1).jpeg": "zapallo-cabutia-romero.webp",
    "WhatsApp Image 2026-11-18 at 1.03.13 AM (2).jpeg": "jamon-cocido.webp",
    "WhatsApp Image 2026-11-18 at 1.03.16 AM.jpeg": "jamon-cocido-detalle.webp",
}


def guardar_fotos():
    for origen, destino in FOTOS.items():
        ruta = INFO / origen
        if not ruta.exists():
            print(f"Falta {origen}")
            continue
        imagen = Image.open(ruta).convert("RGB")
        imagen.thumbnail((1400, 1400), Image.LANCZOS)
        imagen.save(OUT_PROD / destino, "WEBP", quality=86, method=6)


def fuente(tamano, bold=False):
    candidatos = [
        "C:/Windows/Fonts/urbanist-bold.ttf" if bold else "C:/Windows/Fonts/urbanist-semibold.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for ruta in candidatos:
        if os.path.exists(ruta):
            return ImageFont.truetype(ruta, tamano)
    return ImageFont.load_default()


def guardar_banners():
    configuraciones = [
        ("banner-napolitana.webp", "margherita.webp", CREAM, ORANGE,
         "PIZZA NAPOLITANA", "Hecha despacio. Comida rápido.", "Tucumán"),
        ("banner-eventos.webp", "pepperoni-detalle.webp", GREEN, ORANGE,
         "CATERING PARA EVENTOS", "Llevamos el horno a tu evento.", "Masa fresca · producción en vivo"),
        ("banner-sabores.webp", "queso-azul-repollo.webp", ORANGE, CREAM,
         "EL SABOR DE LO DIFERENTE", "De autor, clásicas y la de la casa.", "Pedí tu pizza favorita"),
    ]
    ancho, alto = 1200, 500
    for nombre, foto, fondo, tinta, titulo, subtitulo, pie in configuraciones:
        lienzo = Image.new("RGB", (ancho, alto), fondo)
        imagen = Image.open(OUT_PROD / foto).convert("RGB")
        # La foto ocupa el lado derecho con un recorte vertical.
        lado = 560
        escala = max(lado / imagen.width, alto / imagen.height)
        imagen = imagen.resize((int(imagen.width * escala), int(imagen.height * escala)), Image.LANCZOS)
        x0 = (imagen.width - lado) // 2
        y0 = (imagen.height - alto) // 2
        imagen = imagen.crop((x0, y0, x0 + lado, y0 + alto))
        lienzo.paste(imagen, (ancho - lado, 0))

        dibujo = ImageDraw.Draw(lienzo)
        f_titulo = fuente(54, bold=True)
        f_sub = fuente(33)
        f_pie = fuente(24, bold=True)
        dibujo.text((64, 108), titulo, font=f_titulo, fill=tinta)
        dibujo.text((64, 190), subtitulo, font=f_sub, fill=tinta)
        dibujo.rectangle((64, 268, 120, 272), fill=tinta)
        dibujo.text((64, 300), pie, font=f_pie, fill=tinta)
        dibujo.text((64, 420), "TAMARINDO", font=fuente(28, bold=True), fill=tinta)
        lienzo.save(OUT_BANNER / nombre, "WEBP", quality=88, method=6)


if __name__ == "__main__":
    for carpeta in (OUT_LOGO, OUT_PROD, OUT_BANNER):
        carpeta.mkdir(parents=True, exist_ok=True)
    guardar_logos()
    guardar_patron()
    guardar_fotos()
    guardar_banners()
    print("Assets generados correctamente.")
