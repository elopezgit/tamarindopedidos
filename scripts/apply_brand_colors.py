"""Aplica la paleta oficial de Tamarindo a todos los archivos CSS.

Colores permitidos (Branding Opción 4):
  crema #F6EBE2 · naranja #EC681D · rojo #DF1517 · verde profundo #013325
Combinaciones a evitar: texto verde profundo sobre naranja o rojo.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

COMUN = {
    # Verde del tema oscuro / WhatsApp → verde de marca o naranja.
    '#20c997': '#ec681d',
    'rgba(32, 201, 151, 0.16)': 'rgba(236, 104, 29, 0.18)',
    'rgba(12, 166, 120, 0.25)': 'rgba(236, 104, 29, 0.28)',
    # Sombras y velos con tonos grises/azulados → verde profundo.
    'rgba(15, 23, 42,': 'rgba(1, 51, 37,',
    'rgba(20, 4, 10,': 'rgba(1, 51, 37,',
    'rgba(10, 10, 14,': 'rgba(1, 51, 37,',
    'rgba(15, 12, 10,': 'rgba(1, 51, 37,',
    'rgba(19, 19, 22,': 'rgba(1, 51, 37,',
    # Rojo heredado → rojo de marca.
    'rgba(229, 25, 55,': 'rgba(223, 21, 23,',
    'rgba(200, 14, 43,': 'rgba(223, 21, 23,',
    # Blanco puro → crema (base de la paleta).
    '#ffffff': '#f6ebe2',
    '#fff': '#f6ebe2',
    'rgba(255, 253, 251,': 'rgba(246, 235, 226,',
    'rgba(255, 255, 255,': 'rgba(246, 235, 226,',
    # Velos negros → verde profundo.
    'rgba(0, 0, 0,': 'rgba(1, 51, 37,',
}

ESPECIFICO = {
    'styles.css': {
        '#12b886': '#013325',                                  # botón WhatsApp
        'rgba(18, 184, 134, 0.25)': 'rgba(1, 51, 37, 0.28)',
        '#4ade80': '#f6ebe2',                                  # punto de estado sobre naranja
        'rgba(74, 222, 128, 0.25)': 'rgba(246, 235, 226, 0.3)',
        '#8d1220': '#013325',                                  # degradado del hero
        '#18181b': '#013325',
        '#71717a': '#6d7d76',
        '#1f1f26': '#013325',
    },
    'admin.css': {
        '--blue: #3b82f6': '--blue: #013325',
        '#3b82f6': '#013325',
        '#ff8a8a': '#df1517',
        '#ff7272': '#df1517',
        '#ff8585': '#df1517',
        '#ff6b6b': '#df1517',
        '#c8102e': '#df1517',
        '#99081f': '#df1517',
        '#fef2f2': '#fdf7f2',
        '#fde047': '#f6ebe2',                                  # eyebrow del topbar
        '#141210': '#013325',
        '#000': '#013325',
        'rgba(252, 175, 21, 0.035)': 'rgba(236, 104, 29, 0.05)',
        'rgba(255, 159, 67, 0.14)': 'rgba(236, 104, 29, 0.14)',
        'rgba(100, 168, 255, 0.14)': 'rgba(236, 104, 29, 0.14)',
    }
}


def reemplazar(texto, antiguo, nuevo):
    # Los hexadecimales se reemplazan solo cuando no son prefijo de otro color.
    if re.fullmatch(r'#[0-9a-fA-F]{3,8}', antiguo):
        patron = re.compile(re.escape(antiguo) + r'\b', re.IGNORECASE)
        return patron.sub(nuevo, texto)
    return texto.replace(antiguo, nuevo)


for nombre, mapa in ESPECIFICO.items():
    ruta = ROOT / nombre
    contenido = ruta.read_text(encoding='utf-8')
    original = contenido

    for antiguo, nuevo in COMUN.items():
        contenido = reemplazar(contenido, antiguo, nuevo)
    for antiguo, nuevo in mapa.items():
        contenido = reemplazar(contenido, antiguo, nuevo)

    ruta.write_text(contenido, encoding='utf-8')
    print(f'{nombre}: {"modificado" if contenido != original else "sin cambios"}')
