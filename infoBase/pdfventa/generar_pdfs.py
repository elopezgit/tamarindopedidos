# -*- coding: utf-8 -*-
"""Genera los dos PDF de venta de Tamarindo con las capturas reales del sistema.

Uso:  python infoBase/pdfventa/generar_pdfs.py
Requiere: reportlab (pip install reportlab). Fuentes y capturas van incluidas.
"""
import math
import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(ROOT, "capturas")
FNT = os.path.join(ROOT, "fuentes")

W, H = A4
CREAM = colors.HexColor("#F6EBE2")
ORANGE = colors.HexColor("#EC681D")
RED = colors.HexColor("#DF1517")
GREEN = colors.HexColor("#013325")
WHITE = colors.HexColor("#FFFDFB")
MUTED = colors.HexColor("#5C7068")
LINE = colors.HexColor("#DCCBBE")
SOFT = colors.HexColor("#EFE2D6")

# ── Fuentes ────────────────────────────────────────────────────────────────
for name, file in [
    ("U-Regular", "Urbanist-Regular.ttf"),
    ("U-SemiBold", "Urbanist-SemiBold.ttf"),
    ("U-Bold", "Urbanist-Bold.ttf"),
    ("U-ExtraBold", "Urbanist-ExtraBold.ttf"),
    ("U-Black", "Urbanist-Black.ttf"),
    ("Script", "Covered.ttf"),
]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(FNT, file)))

LOGO = os.path.join(ROOT, "..", "..", "img", "logo", "tamarindo-logo.png")
LOGO_CREAM = os.path.join(ROOT, "..", "..", "img", "logo", "tamarindo-logo-cream.webp")


# ── Utilidades de dibujo ───────────────────────────────────────────────────
def wrap(text, font, size, maxw):
    out = []
    for raw in str(text).split("\n"):
        if not raw.strip():
            out.append("")
            continue
        cur = ""
        for word in raw.split():
            test = (cur + " " + word).strip()
            if pdfmetrics.stringWidth(test, font, size) <= maxw:
                cur = test
            else:
                if cur:
                    out.append(cur)
                cur = word
        if cur:
            out.append(cur)
    return out


def para(c, text, x, y, maxw, font="U-Regular", size=10, leading=15,
         color=GREEN, align="left"):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap(text, font, size, maxw):
        if align == "center":
            c.drawCentredString(x + maxw / 2, y, line)
        elif align == "right":
            c.drawRightString(x + maxw, y, line)
        else:
            c.drawString(x, y, line)
        y -= leading
    return y


def card(c, x, y, w, h, fill=WHITE, r=10, stroke=None, sw=0.8):
    c.setFillColor(fill)
    c.setStrokeColor(stroke if stroke else fill)
    c.roundRect(x, y, w, h, r, stroke=1 if stroke else 0, fill=1)
    if stroke:
        c.setLineWidth(sw)


def chip(c, x, y, n, color=ORANGE, r=11):
    c.setFillColor(color)
    c.circle(x + r, y + r, r, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("U-Bold", 10)
    c.drawCentredString(x + r, y + r - 3.5, str(n))


def bullets(c, y, items, x=48, width=None, size=10, leading=16, color=GREEN):
    width = width or (W - 96 - x + 48)
    for it in items:
        c.setFillColor(ORANGE)
        c.circle(x + 3, y + 4, 2.6, stroke=0, fill=1)
        y = para(c, it, x + 14, y, width - 14, size=size, leading=leading, color=color) - 6
    return y


def shot(c, name, x, top, w, caption=None, cap_size=8.5, maxh=None):
    """Dibuja una captura cuyo borde superior queda en 'top' (nunca sube).

    Devuelve la altura total ocupada (imagen + epígrafe) para poder ubicar
    el siguiente elemento justo debajo sin solapes.
    """
    path = os.path.join(CAP, name + ".png")
    iw, ih = ImageReader(path).getSize()
    slot = w
    h = slot * ih / iw
    if maxh and h > maxh:
        h = maxh
        w = h * iw / ih
    cx = x + (slot - w) / 2
    y = top - h
    card(c, cx - 5, y - 5, w + 10, h + 10, fill=LINE, r=7)
    c.drawImage(path, cx, y, w, h, mask="auto")
    if caption:
        para(c, caption, cx, y - 18, w, size=cap_size, leading=12, color=MUTED)
        h += 22
    return h


def pattern(c, color=ORANGE, alpha=0.06):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.4)
    c.setFillAlpha(alpha)
    c.setStrokeAlpha(alpha)
    for i in range(-3, 16):
        x = i * 58
        c.line(x, 0, x + 250, H)
    for i in range(6):
        c.circle(80 + i * 105, 120 + (i % 3) * 230, 46, stroke=0, fill=1)
    c.restoreState()


def begin(c, section, first=False, dark=False):
    if not first:
        c.showPage()
    c.setFillColor(GREEN if dark else CREAM)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    if dark:
        pattern(c)
    c.setFillColor(ORANGE)
    c.rect(0, H - 6, W, 6, stroke=0, fill=1)
    if dark:
        c.drawImage(LOGO_CREAM, 48, H - 52, 24, 24, mask="auto")
        c.setFillColor(CREAM)
    else:
        c.drawImage(LOGO, 48, H - 52, 24, 24, mask="auto")
        c.setFillColor(GREEN)
    c.setFont("U-Bold", 8)
    c.drawString(80, H - 38, "TAMARINDO · PIZZA NAPOLITANA")
    c.setFont("U-Regular", 8)
    c.drawRightString(W - 48, H - 38, section.upper())
    c.setStrokeColor(ORANGE if dark else LINE)
    c.setLineWidth(0.8)
    c.line(48, H - 64, W - 48, H - 64)
    return H - 92


def h2(c, y, kicker, title, sub=None):
    c.setFont("U-Bold", 8)
    c.setFillColor(ORANGE)
    c.drawString(48, y, kicker.upper())
    c.setFont("U-Bold", 21)
    c.setFillColor(GREEN)
    c.drawString(48, y - 28, title)
    y -= 44
    if sub:
        y = para(c, sub, 48, y, W - 96, size=10, leading=15, color=MUTED) - 8
    return y - 4


def footer(c, num, dark=False):
    c.setStrokeColor(ORANGE if dark else LINE)
    c.setLineWidth(0.7)
    c.line(48, 36, W - 48, 36)
    c.setFont("U-Regular", 7.5)
    c.setFillColor(CREAM if dark else MUTED)
    c.drawString(48, 23, "Tamarindo · El sabor de lo diferente · Tucumán")
    c.drawRightString(W - 48, 23, str(num))


def feature_grid(c, y, items, cols=2, cardh=84, gap=12, size=9):
    x0 = 48
    avail = W - 96
    cw = (avail - gap * (cols - 1)) / cols
    rows = math.ceil(len(items) / cols)
    for i, (title, desc) in enumerate(items):
        r, col = divmod(i, cols)
        x = x0 + col * (cw + gap)
        yy = y - r * (cardh + gap)
        card(c, x, yy - cardh, cw, cardh, fill=WHITE, stroke=LINE)
        chip(c, x + 12, yy - 31, i + 1, color=ORANGE if i % 2 == 0 else RED)
        c.setFont("U-Bold", 11)
        c.setFillColor(GREEN)
        c.drawString(x + 37, yy - 23, title)
        para(c, desc, x + 37, yy - 41, cw - 50, size=size, leading=12.5, color=MUTED)
    return y - rows * (cardh + gap)


def step(c, x, y, w, n, title, desc, h=54):
    card(c, x, y - h, w, h, fill=WHITE, stroke=LINE)
    c.setFillColor(ORANGE)
    c.rect(x, y - h, 5, h, stroke=0, fill=1)
    chip(c, x + 14, y - 35, n, color=GREEN, r=11)
    c.setFont("U-Bold", 10.5)
    c.setFillColor(GREEN)
    c.drawString(x + 42, y - 21, title)
    para(c, desc, x + 42, y - 37, w - 56, size=8.5, leading=11.5, color=MUTED)
    return y - h


def contact_box(c, x, y, w, dark=True):
    h = 140
    card(c, x, y - h, w, h, fill=GREEN if dark else WHITE,
         stroke=None if dark else LINE, r=12)
    c.setFillColor(ORANGE)
    c.roundRect(x, y - h, 5, h, 2, stroke=0, fill=1)
    c.setFont("U-Bold", 9)
    c.setFillColor(ORANGE)
    c.drawString(x + 22, y - 24, "HABLEMOS")
    lines = [
        "WhatsApp  ·  +54 9 381 393 7777",
        "Retiro  ·  Av. Nicolás Avellaneda 575, San Miguel de Tucumán",
        "Email  ·  tamarindopizzeria@gmail.com",
        "Instagram  ·  @tamarindo.pizzeria",
        "Tucumán, Argentina",
    ]
    yy = y - 47
    for line in lines:
        para(c, line, x + 22, yy, w - 44, size=10.5, leading=0, color=CREAM)
        yy -= 19


# ══════════════════════════════════════════════════════════════════════════════
# 1) PRESENTACIÓN COMERCIAL
# ══════════════════════════════════════════════════════════════════════════════
def presentacion():
    c = canvas.Canvas(os.path.join(ROOT, "Tamarindo_Presentacion_Comercial.pdf"),
                      pagesize=A4)
    c.setTitle("Tamarindo · Presentación comercial")
    c.setAuthor("Tamarindo Pizzería")
    page = 0

    # ── Portada ──
    c.setFillColor(GREEN)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    pattern(c, alpha=0.075)
    c.setFillColor(ORANGE)
    c.rect(0, 0, W, 10, stroke=0, fill=1)
    c.rect(0, H - 10, W, 10, stroke=0, fill=1)
    c.drawImage(LOGO, W / 2 - 62, H - 245, 124, 124, mask="auto")
    c.setFont("Script", 40)
    c.setFillColor(ORANGE)
    c.drawCentredString(W / 2, H - 285, "El sabor de lo diferente")
    c.setFont("U-Regular", 11)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, H - 312, "Hecha despacio. Comida rápido.")
    c.setStrokeColor(ORANGE)
    c.setLineWidth(1.4)
    c.line(W / 2 - 90, H - 335, W / 2 + 90, H - 335)
    c.setFont("U-Black", 25)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, H - 383, "Sistema de pedidos")
    c.drawCentredString(W / 2, H - 417, "y administración")
    c.setFont("U-Regular", 12.5)
    c.setFillColor(ORANGE)
    c.drawCentredString(W / 2, H - 450, "Desarrollado a medida para Tamarindo Pizzas")
    c.setFont("U-Regular", 10)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, H - 475, "Tienda de pedidos · Panel de administración · Tucumán")
    contact_box(c, 78, 190, W - 156)
    c.setFont("U-Regular", 9)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, 42, "Documento comercial · Tamarindo Pizzería")
    page += 1

    # ── P2 El desafío / la solución ──
    y = begin(c, "Presentación")
    y = h2(c, y, "El punto de partida", "Cuando el WhatsApp no alcanza")
    card(c, 48, y - 196, (W - 108) / 2, 196, fill=WHITE, stroke=LINE)
    card(c, 60 + (W - 108) / 2, y - 196, (W - 108) / 2, 196, fill=GREEN)
    c.setFont("U-Bold", 12)
    c.setFillColor(RED)
    c.drawString(68, y - 26, "ANTES")
    c.setFont("U-Bold", 12)
    c.setFillColor(ORANGE)
    c.drawString(80 + (W - 108) / 2, y - 26, "AHORA")
    left = [
        "Pedidos que se mezclan con otros mensajes.",
        "Datos de clientes que se pierden o quedan dispersos.",
        "No hay historial ni forma de saber cuánto se vendió.",
        "El catálogo se actualiza a mano y con errores.",
    ]
    right = [
        "Un sistema propio con la identidad de Tamarindo.",
        "Cada pedido queda estructurado y registrado.",
        "Clientes, ventas y productos, visibles en un panel.",
        "El dueño administra todo sin tocar una línea de código.",
    ]
    bullets(c, y - 52, left, x=68, width=(W - 108) / 2 - 40, size=9.5, leading=14)
    bullets(c, y - 52, right, x=80 + (W - 108) / 2, width=(W - 108) / 2 - 42,
            size=9.5, leading=14, color=CREAM)
    y -= 220
    c.setFillColor(SOFT)
    c.roundRect(48, y - 84, W - 96, 84, 12, stroke=0, fill=1)
    c.setFillColor(ORANGE)
    c.roundRect(48, y - 84, 5, 84, 2, stroke=0, fill=1)
    c.setFont("Script", 23)
    c.setFillColor(GREEN)
    c.drawString(70, y - 34, "Tu negocio tiene su propio sistema de pedidos.")
    para(c, "Diseñado exclusivamente para la marca: misma paleta, mismo tono y la misma forma de trabajar que Tamarindo ya usa todos los días.",
         70, y - 58, W - 140, size=10, leading=15, color=MUTED)
    footer(c, page := page + 1)

    # ── P3 Dos sistemas ──
    y = begin(c, "Presentación")
    y = h2(c, y, "La solución", "Dos sistemas, una sola operación")
    cw = (W - 108) / 2
    card(c, 48, y - 430, cw, 430, fill=WHITE, stroke=LINE)
    card(c, 60 + cw, y - 430, cw, 430, fill=GREEN)
    c.setFont("U-Bold", 15)
    c.setFillColor(GREEN)
    c.drawString(68, y - 30, "Sistema cliente")
    c.setFont("U-Regular", 9)
    c.setFillColor(ORANGE)
    c.drawString(68, y - 48, "LA TIENDA")
    para(c, "La experiencia de compra que vive el cliente en el celular o la computadora: elige, arma su pedido y lo envía por WhatsApp.",
         68, y - 70, cw - 40, size=10, leading=15, color=MUTED)
    shot(c, "01_tienda_hero", 68, y - 125, cw - 40, maxh=290)

    c.setFont("U-Bold", 15)
    c.setFillColor(ORANGE)
    c.drawString(80 + cw, y - 30, "Panel de administración")
    c.setFont("U-Regular", 9)
    c.setFillColor(CREAM)
    c.drawString(80 + cw, y - 48, "LA GESTIÓN")
    para(c, "El espacio privado del dueño: pedidos, productos, categorías, banners, clientes e indicadores para decidir con datos.",
         80 + cw, y - 70, cw - 40, size=10, leading=15, color=CREAM)
    shot(c, "16_admin_resumen", 80 + cw, y - 125, cw - 40)
    footer(c, page := page + 1)

    # ── P4 Flujo ──
    y = begin(c, "Presentación")
    y = h2(c, y, "Cómo funciona", "Del pedido a la gestión, sin pasos manuales",
           "El cliente hace el pedido como siempre lo haría por WhatsApp. La diferencia está en todo lo que pasa detrás.")
    flow = [
        ("El cliente arma su pedido", "Productos, cantidades, notas y modalidad: delivery, retiro o evento."),
        ("El pedido se guarda solo", "Se registra en la base de datos con código propio y todo el detalle."),
        ("Llega al WhatsApp del negocio", "El mensaje ya viene ordenado con cliente, ítems, totales y notas."),
        ("Aparece en el panel", "El pedido queda en la columna Pendientes del tablero de gestión."),
        ("El dueño lo gestiona", "Cambia de estado, lo imprime o contacta al cliente desde el panel."),
    ]
    x = 78
    ww = W - 156
    for i, (t, d) in enumerate(flow):
        y = step(c, x, y, ww, i + 1, t, d)
        if i < len(flow) - 1:
            c.setStrokeColor(ORANGE)
            c.setLineWidth(1.6)
            c.line(x + 42, y - 2, x + 42, y - 12)
            c.beginPath()
            p = c.beginPath()
            p.moveTo(x + 38, y - 11)
            p.lineTo(x + 42, y - 5)
            p.lineTo(x + 46, y - 11)
            c.setFillColor(ORANGE)
            c.drawPath(p, stroke=0, fill=1)
            y -= 12
    c.setFillColor(SOFT)
    c.roundRect(48, 88, W - 96, 46, 10, stroke=0, fill=1)
    para(c, "Si la base de datos no responde, el pedido igual se abre en WhatsApp: la venta nunca se pierde.",
         62, 104, W - 124, size=10, leading=0, color=GREEN)
    footer(c, page := page + 1)

    # ── P5 Funcionalidades tienda ──
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "La tienda", "Todo lo que el cliente puede hacer")
    items = [
        ("Buscar en vivo", "Encuentra pizzas por nombre, ingrediente o etiqueta, incluso con acentos."),
        ("Explorar categorías", "Clásicas, de autor, de la casa y eventos, en tres vistas sincronizadas."),
        ("Ver promociones", "Carrusel automático de banners con enlaces a eventos y al menú."),
        ("Fichas completas", "Ingredientes, preparación, calificación y precio con tramos por cantidad."),
        ("Armar su carrito", "Agrega, quita y deja notas por producto; el carrito se recuerda al volver."),
        ("Elegir modalidad", "Delivery, retiro o evento con campos específicos para cada caso."),
        ("Presupuestar eventos", "Tramos por invitados, fecha y lugar del evento con mínimo de 20 personas."),
        ("Enviar por WhatsApp", "Checkout validado, pedido estructurado y confirmación con reenvío."),
    ]
    y = feature_grid(c, y, items, cardh=80)
    footer(c, page := page + 1)

    # ── P6 Capturas tienda ──
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "En pantalla", "La tienda en funcionamiento")
    slot = (W - 96 - 16) / 2
    shot(c, "01_tienda_hero", 48, y - 25, slot,
         "Inicio de la tienda en el celular.", maxh=520)
    shot(c, "07_tienda_carrito", 48 + slot + 16, y - 25, slot,
         "Carrito móvil con ítems, notas y envío a WhatsApp.", maxh=520)
    footer(c, page := page + 1)

    # ── P7 Funcionalidades admin ──
    y = begin(c, "Panel de administración")
    y = h2(c, y, "La gestión", "Todo lo que el dueño puede hacer")
    items = [
        ("Resumen e indicadores", "Pedidos, pendientes, ventas registradas, productos y clientes."),
        ("Tablero de pedidos", "Kanban de 7 estados con arrastrar y soltar, importes y búsqueda."),
        ("Detalle y estados", "Cada pedido con sus ítems, notas, total y avance de estado."),
        ("CRUD de productos", "Alta, edición, precios, fotos, destacados, visibilidad y duplicado."),
        ("Ajuste masivo de precios", "Cambia precios por porcentaje, monto fijo o valor exacto."),
        ("Categorías y asignación", "Crea categorías, ordena y asigna productos de forma masiva."),
        ("Banners", "Carrusel editable con títulos, imágenes, orden y enlaces."),
        ("Clientes", "Base con teléfono, email, dirección y cumpleaños para contactar."),
    ]
    y = feature_grid(c, y, items, cardh=80)
    footer(c, page := page + 1)

    # ── P8 Capturas admin ──
    y = begin(c, "Panel de administración")
    y = h2(c, y, "En pantalla", "El panel en funcionamiento")
    top = y - 20
    h = shot(c, "17_admin_kanban", 48, top, W - 96,
             "Tablero de pedidos: columnas por estado, importes y tarjetas arrastrables.", maxh=280)
    shot(c, "25_admin_clientes", 48, top - h - 16, W - 96,
         "Base de clientes con pedidos asociados, gasto acumulado y contacto directo.", maxh=280)
    footer(c, page := page + 1)

    # ── P9 Dos modos ──
    y = begin(c, "Presentación")
    y = h2(c, y, "Flexibilidad", "Dos formas de usarlo, elegí la tuya")
    cw = (W - 108) / 2
    for i, (x, title, tag, color, lines_) in enumerate([
        (48, "Solo WhatsApp", "MODO ESENCIAL", GREEN, [
            "Recibís el pedido completo y ordenado en tu WhatsApp.",
            "No necesitás abrir el panel ni cargar datos.",
            "Ideal si hoy solo querés reemplazar los mensajes sueltos.",
            "El pedido de todos modos queda guardado en la base.",
        ]),
        (60 + cw, "WhatsApp + Panel", "MODO COMPLETO", ORANGE, [
            "Además, ves cada pedido en un tablero por estados.",
            "Administrás productos, categorías y banners sin código.",
            "Consultás clientes, ventas e indicadores de un vistazo.",
            "Recomendado para tomar decisiones con datos reales.",
        ]),
    ]):
        card(c, x, y - 250, cw, 250, fill=WHITE, stroke=LINE)
        c.setFillColor(color)
        c.roundRect(x, y - 250, cw, 6, 2, stroke=0, fill=1)
        c.setFont("U-Bold", 15)
        c.setFillColor(GREEN)
        c.drawString(x + 20, y - 34, title)
        c.setFont("U-Bold", 8)
        c.setFillColor(color)
        c.drawString(x + 20, y - 52, tag)
        bullets(c, y - 78, lines_, x=x + 20, width=cw - 40, size=9.5, leading=14)
    c.setFillColor(SOFT)
    c.roundRect(48, y - 290, W - 96, 30, 8, stroke=0, fill=1)
    para(c, "Podés empezar en modo esencial y activar el panel cuando lo necesites: los datos ya están guardados.",
         62, y - 280, W - 124, size=10, leading=0, color=GREEN)
    footer(c, page := page + 1)

    # ── P10 Datos / KPIs ──
    y = begin(c, "Presentación")
    y = h2(c, y, "Decisiones", "Tus datos, en un solo lugar")
    kpis = [
        ("Pedidos totales", "Todos los pedidos registrados."),
        ("Pedidos pendientes", "Los que están en curso, listos para preparar."),
        ("Ventas registradas", "Suma de totales de pedidos, sin cancelados."),
        ("Productos activos", "Cuántos se muestran y cuántos están ocultos."),
        ("Clientes registrados", "Cada persona que hizo un pedido."),
        ("Pedidos y gasto por cliente", "Para saber quién compra más y cuánto."),
    ]
    y = feature_grid(c, y, kpis, cardh=78)
    y -= 6
    c.setFillColor(SOFT)
    c.roundRect(48, y - 96, W - 96, 96, 10, stroke=0, fill=1)
    c.setFont("U-Bold", 10)
    c.setFillColor(RED)
    c.drawString(62, y - 22, "ALCANCE REAL DEL SISTEMA")
    para(c, "El panel muestra indicadores y permite imprimir la vista activa desde el navegador. No incluye un módulo de reportes exportables ni métricas de capital, costos o márgenes: esa información no se registra hoy en el sistema.",
         62, y - 42, W - 124, size=9.5, leading=14, color=GREEN)
    footer(c, page := page + 1)

    # ── P11 Marca siempre al día ──
    y = begin(c, "Presentación")
    y = h2(c, y, "Administración", "Tu marca, siempre al día")
    items = [
        ("Catálogo administrable", "Precios, fotos, ingredientes, orden y visibilidad de cada producto."),
        ("Categorías flexibles", "Crealas, renombralas, ocultalas y cambiá su orden desde el panel."),
        ("Banners editables", "Cambiá las promociones del carrusel sin tocar el código."),
        ("Carga automática", "La tienda toma catálogo, categorías y banners de la base al iniciar."),
        ("Caché offline", "Si hay un corte de conexión, el panel sigue mostrando los últimos datos."),
        ("Diseño adaptable", "Tema claro y oscuro, versión móvil y panel responsive."),
    ]
    y = feature_grid(c, y, items, cardh=74)
    shot(c, "24_admin_banners", 48, y - 18, W - 96,
         "Gestión de banners: vista previa, orden, visibilidad y enlaces.")
    footer(c, page := page + 1)

    # ── P12 Acceso y cierre ──
    y = begin(c, "Presentación")
    y = h2(c, y, "Acceso", "Listo para usar")
    card(c, 48, y - 122, W - 96, 122, fill=GREEN)
    c.setFont("U-Bold", 9)
    c.setFillColor(ORANGE)
    c.drawString(68, y - 26, "INGRESO AL PANEL")
    c.setFont("U-Bold", 20)
    c.setFillColor(CREAM)
    c.drawString(68, y - 58, "Usuario: admin")
    c.drawString(68, y - 86, "Contraseña: 123456")
    para(c, "Nota: son las credenciales con las que se entrega el sistema. Se recomienda cambiarlas antes de compartir el acceso.",
         300, y - 58, W - 370, size=9.5, leading=14, color=CREAM)
    y -= 150
    shot(c, "15_admin_login", 48, y + 12, W - 96,
         "Pantalla de acceso al panel de administración.")
    contact_box(c, 48, 200, W - 96)
    footer(c, page := page + 1)

    c.save()
    print("OK Presentacion comercial -", page, "paginas")


# ══════════════════════════════════════════════════════════════════════════════
# 2) MANUAL DE USO
# ══════════════════════════════════════════════════════════════════════════════
def manual():
    c = canvas.Canvas(os.path.join(ROOT, "Tamarindo_Manual_de_Uso.pdf"), pagesize=A4)
    c.setTitle("Tamarindo · Manual de uso")
    c.setAuthor("Tamarindo Pizzería")
    page = 0

    # Portada
    c.setFillColor(GREEN)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    pattern(c, alpha=0.075)
    c.setFillColor(ORANGE)
    c.rect(0, 0, W, 10, stroke=0, fill=1)
    c.rect(0, H - 10, W, 10, stroke=0, fill=1)
    c.drawImage(LOGO, W / 2 - 58, H - 230, 116, 116, mask="auto")
    c.setFont("Script", 38)
    c.setFillColor(ORANGE)
    c.drawCentredString(W / 2, H - 268, "El sabor de lo diferente")
    c.setFont("U-Black", 30)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, H - 335, "Manual de uso")
    c.setFont("U-Regular", 12)
    c.setFillColor(ORANGE)
    c.drawCentredString(W / 2, H - 368, "Tienda de pedidos y panel de administración")
    c.setFont("U-Regular", 10)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, H - 392, "Tamarindo Pizzas · Tucumán")
    contact_box(c, 78, 185, W - 156)
    c.setFont("U-Regular", 9)
    c.setFillColor(CREAM)
    c.drawCentredString(W / 2, 42, "Documento de uso · Tamarindo Pizzería")
    page += 1

    # Índice
    y = begin(c, "Manual de uso")
    y = h2(c, y, "Contenido", "Qué vas a encontrar")
    left = [
        "1. Primeros pasos",
        "2. La tienda: pantalla de inicio",
        "3. Buscar y explorar el menú",
        "4. Banners y promociones",
        "5. Elegir un producto",
        "6. Armar el carrito",
        "7. Modalidades y eventos",
        "8. Enviar el pedido",
        "9. La experiencia móvil",
    ]
    right = [
        "10. Acceder al panel",
        "11. Resumen e indicadores",
        "12. Pedidos: tablero kanban",
        "13. Pedidos: lista y detalle",
        "14. Productos",
        "15. Categorías",
        "16. Asignación y banners",
        "17. Clientes",
        "18. Alcance y buenas prácticas",
    ]
    c.setFont("U-Bold", 10)
    c.setFillColor(ORANGE)
    c.drawString(48, y, "SISTEMA CLIENTE")
    c.drawString(60 + (W - 108) / 2, y, "PANEL DE ADMINISTRACIÓN")
    bullets(c, y - 24, left, x=48, width=(W - 108) / 2 - 20, size=10, leading=18)
    bullets(c, y - 24, right, x=60 + (W - 108) / 2, width=(W - 108) / 2 - 20,
            size=10, leading=18)
    footer(c, page := page + 1)

    # 1 Primeros pasos
    y = begin(c, "Manual de uso")
    y = h2(c, y, "Capítulo 1", "Primeros pasos",
           "El sistema tiene dos accesos: la tienda, que es pública, y el panel de administración, que es privado del dueño.")
    card(c, 48, y - 96, W - 96, 96, fill=GREEN)
    c.setFont("U-Bold", 10)
    c.setFillColor(ORANGE)
    c.drawString(68, y - 26, "ACCESOS")
    c.setFont("U-Bold", 13)
    c.setFillColor(CREAM)
    c.drawString(68, y - 52, "Tienda: index.html")
    c.drawString(68, y - 76, "Panel: admin.html")
    para(c, "Usuario: admin  ·  Contraseña: 123456", 330, y - 52, W - 390,
         size=12, leading=0, color=CREAM)
    y -= 120
    y = bullets(c, y, [
        "La tienda abre directo, sin usuario ni clave: cualquiera puede hacer un pedido.",
        "El panel pide usuario y clave al entrar y mantiene la sesión en el navegador.",
        "Se recomienda cambiar las credenciales de entrega antes de dar acceso a otras personas.",
        "Ambas pantallas funcionan en computadora, tablet y celular.",
    ], size=10, leading=15)
    footer(c, page := page + 1)

    # 2 Inicio
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 2", "La tienda: pantalla de inicio")
    top = y - 20
    h = shot(c, "01_tienda_hero", 48, top, W - 96,
             "Inicio de la tienda en el celular: buscador, titular y accesos por categoría.", maxh=410)
    bullets(c, top - h - 16, [
        "El botón de tema cambia entre la versión clara y la oscura; la elección se recuerda.",
        "El punto de estado invita a consultar por WhatsApp.",
        "El botón Pedido muestra cuántos productos llevás en el carrito.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 3 Buscar / categorías
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 3", "Buscar y explorar el menú",
           "El buscador filtra mientras escribís, por nombre, descripción, ingredientes y etiquetas; ignora acentos y mayúsculas.")
    slot = (W - 96 - 16) / 2
    shot(c, "02_tienda_categorias", 48, y - 25, slot,
         "Categorías y accesos rápidos.", maxh=430)
    shot(c, "04_tienda_menu", 48 + slot + 16, y - 25, slot,
         "Carta agrupada por categoría.", maxh=430)
    footer(c, page := page + 1)

    # 4 Banners
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 4", "Banners y promociones")
    top = y - 20
    h = shot(c, "03_tienda_banners", 48, top, W - 96,
             "Carrusel de banners en el celular, con puntos navegables.", maxh=410)
    bullets(c, top - h - 16, [
        "Los banners pueden llevar al menú o abrir un WhatsApp con mensaje preparado.",
        "Se muestran los que estén activos y en el orden definido desde el panel.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 5 Producto
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 5", "Elegir un producto")
    top = y - 20
    h = shot(c, "05_tienda_ficha_producto", 48, top, W - 96,
             "Ficha de producto en el celular: precio, ingredientes y cantidad.", maxh=410)
    bullets(c, top - h - 16, [
        "Tocá una tarjeta para ver la ficha completa; el botón + la agrega directo al carrito.",
        "En eventos, el precio por persona se recalcula según la cantidad de invitados.",
        "El mínimo para productos por persona es 20; el tope general es 999 unidades.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 6 Carrito
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 6", "Armar el carrito")
    slot = (W - 96 - 16) / 2
    shot(c, "06_tienda_productos_en_carrito", 48, y - 25, slot,
         "Control de cantidad dentro del menú.", maxh=430)
    shot(c, "07_tienda_carrito", 48 + slot + 16, y - 25, slot,
         "Carrito con ítems, notas y totales.", maxh=430)
    footer(c, page := page + 1)

    # 7 Modalidades
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 7", "Modalidades y eventos",
           "Elegí Delivery, Retiro o Evento. Los campos del formulario se ajustan automáticamente a la modalidad elegida.")
    shot(c, "08_tienda_checkout_evento", 48, y - 20, W - 96,
         "Modalidad evento en el celular: fecha, invitados y lugar.", maxh=410)
    footer(c, page := page + 1)

    # 8 Enviar
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 8", "Enviar el pedido")
    y = bullets(c, y, [
        "Completá nombre y WhatsApp; la dirección es obligatoria solo en delivery.",
        "Podés agregar una nota final y ver el resumen con subtotal y total antes de enviar.",
        "Al confirmar, el pedido se guarda en la base de datos y se abre el WhatsApp del negocio.",
        "El mensaje ya viene con código, cliente, modalidad, ítems, notas y total.",
        "Aparece una pantalla de confirmación con el código del pedido y un botón para reenviarlo.",
        "Si la base no responde, el pedido igual se abre por WhatsApp para no perder la venta.",
    ], size=10, leading=16)
    c.setFillColor(SOFT)
    c.roundRect(48, y - 20, W - 96, 56, 10, stroke=0, fill=1)
    para(c, "No hay descuentos, alias ni costos de envío cargados: la forma de pago se coordina directamente por WhatsApp.",
         62, y - 2, W - 124, size=10, leading=14, color=GREEN)
    footer(c, page := page + 1)

    # 9 Móvil
    y = begin(c, "Sistema cliente")
    y = h2(c, y, "Capítulo 9", "La experiencia móvil")
    cw = (W - 108) / 2
    shot(c, "12_movil_hero", 48, y - 20, cw, "Inicio en el celular.")
    shot(c, "13_movil_menu", 60 + cw, y - 20, cw, "Carta y categorías.")
    footer(c, page := page + 1)

    # 10 Login
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 10", "Acceder al panel")
    top = y - 20
    h = shot(c, "15_admin_login", 48, top, W - 160,
             "Ingreso con usuario y contraseña; hay un enlace de vuelta a la tienda.")
    card_y = top - h - 60
    card(c, 48, card_y, W - 96, 62, fill=GREEN)
    c.setFont("U-Bold", 12)
    c.setFillColor(CREAM)
    c.drawString(68, card_y + 24, "Usuario: admin    ·    Contraseña: 123456")
    footer(c, page := page + 1)

    # 11 Resumen
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 11", "Resumen e indicadores")
    top = y - 28
    h = shot(c, "16_admin_resumen", 48, top, W - 160,
             "Indicadores principales, accesos a los CRUD, resumen del menú y pedidos recientes.")
    bullets(c, top - h - 16, [
        "Pedidos totales y pendientes; Ventas registradas suma totales sin cancelados.",
        "Productos activos se muestra como activos / total.",
        "El resumen del menú avisa si hay productos sin categoría.",
        "Los accesos directos abren cada gestión con un clic.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 12 Kanban
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 12", "Pedidos: tablero kanban")
    top = y - 28
    h = shot(c, "17_admin_kanban", 48, top, W - 160,
             "Columnas por estado, cantidad de pedidos e importes acumulados.")
    bullets(c, top - h - 16, [
        "Podés arrastrar una tarjeta a otra columna o usar el selector de estado.",
        "El botón de avance mueve el pedido al siguiente estado: Confirmar, Preparar, Listo, Enviar, Entregar.",
        "Cada tarjeta tiene acceso directo al WhatsApp del cliente y al detalle.",
        "Buscá por cliente, teléfono, código, producto o dirección; filtrá por estado.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 13 Lista y detalle
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 13", "Pedidos: lista y detalle")
    top = y - 28
    h = shot(c, "18_admin_lista_pedidos", 48, top, W - 160,
             "Vista de lista, útil para ver muchos pedidos a la vez.")
    shot(c, "19_admin_detalle_pedido", 48, top - h - 16, W - 160,
         "Detalle del pedido con ítems, totales, nota y cambio de estado.")
    footer(c, page := page + 1)

    # 14 Productos
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 14", "Productos")
    top = y - 28
    h = shot(c, "20_admin_productos", 48, top, W - 160,
             "Tarjetas de productos con filtros, categoría inline y acciones.")
    shot(c, "21_admin_modal_producto", 48, top - h - 16, W - 160,
         "Formulario de producto: precios, unidad, imagen, ingredientes y visibilidad.")
    footer(c, page := page + 1)

    # 15 Categorías
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 15", "Categorías")
    top = y - 28
    h = shot(c, "22_admin_categorias", 48, top, W - 160,
             "Categorías con sus productos, orden y opciones de activación.")
    bullets(c, top - h - 16, [
        "El slug se genera automáticamente a partir del nombre.",
        "Podés subir o bajar el orden, ocultarlas y borrarlas sin eliminar sus productos.",
        "El botón Cargar categorías base crea Clásicas, De autor, De la casa y Eventos.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 16 Asignación y banners
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 16", "Asignación y banners")
    top = y - 28
    h = shot(c, "23_admin_asignacion", 48, top, W - 160,
             "Asignación masiva de categorías y orden editable por producto.")
    shot(c, "24_admin_banners", 48, top - h - 16, W - 160,
         "Banners con vista previa, orden, visibilidad y enlaces rápidos.")
    footer(c, page := page + 1)

    # 17 Clientes
    y = begin(c, "Panel de administración")
    y = h2(c, y, "Capítulo 17", "Clientes")
    top = y - 28
    h = shot(c, "25_admin_clientes", 48, top, W - 160,
             "Base de clientes con pedidos, gasto acumulado y contacto por WhatsApp.")
    bullets(c, top - h - 16, [
        "Cada cliente se crea automáticamente cuando hace su primer pedido.",
        "Se pueden editar nombre, teléfono, email, dirección y fecha de nacimiento.",
        "El enlace de teléfono abre un WhatsApp con un mensaje listo para campañas individuales.",
    ], size=9.5, leading=14)
    footer(c, page := page + 1)

    # 18 Alcance
    y = begin(c, "Manual de uso")
    y = h2(c, y, "Capítulo 18", "Alcance y buenas prácticas")
    c.setFont("U-Bold", 10)
    c.setFillColor(GREEN)
    c.drawString(48, y, "LO QUE EL SISTEMA HACE")
    y = bullets(c, y - 20, [
        "Registra pedidos y clientes en la base de datos y los muestra en el panel.",
        "Permite administrar catálogo, categorías, banners y clientes sin programar.",
        "Mantiene una caché local para seguir viendo datos si hay un corte de conexión.",
        "Carga cambios del catálogo en la tienda automáticamente al iniciar.",
    ], size=9.5, leading=14)
    c.setFont("U-Bold", 10)
    c.setFillColor(RED)
    c.drawString(48, y - 10, "LO QUE EL SISTEMA NO HACE HOY")
    y = bullets(c, y - 32, [
        "No genera reportes exportables; la vista activa puede imprimirse desde el navegador.",
        "No calcula costos, ganancias ni márgenes: solo muestra ventas registradas.",
        "No administra stock ni envía campañas automáticas.",
        "No actualiza el panel en tiempo real: tocá Actualizar para ver lo último.",
    ], size=9.5, leading=14)
    contact_box(c, 48, 200, W - 96)
    footer(c, page := page + 1)

    c.save()
    print("OK Manual de uso -", page, "paginas")


if __name__ == "__main__":
    presentacion()
    manual()
