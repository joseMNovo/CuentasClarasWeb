import os
import json
from datetime import datetime
from loguru import logger

# Ruta absoluta al archivo JSON
BASE_DIR = os.path.dirname(__file__)  # /.../CUENTASCLARASWEB/python
HISTORIAL_FILE = os.path.abspath(os.path.join(BASE_DIR, "..", "json", "historial_cuentas.json"))


# Crear historial_cuentas.json vacío si no existe
if not os.path.exists(HISTORIAL_FILE):
    os.makedirs(os.path.dirname(HISTORIAL_FILE), exist_ok=True)
    with open(HISTORIAL_FILE, 'w') as f:
        f.write('[]')
    logger.info('Archivo historial_cuentas.json creado automáticamente porque no existía.')

def reemplazar_punto_y_coma(valor):
    """
    Convierte un string con puntos o comas a formato float estándar.
    Ejemplo: "1.234,56" -> 1234.56
    """
    try:
        if isinstance(valor, str):
            result = valor.replace('.', '').replace(',', '.')
            return result
        logger.info(f"reemplazar_punto_y_coma: valor no string: {valor}")
        return valor
    except Exception as e:
        logger.error(f"Error en reemplazar_punto_y_coma: {e}")
        return valor

def calcular_cuentas(sueldo1, sueldo2, total_a_pagar):
    """
    Calcula el pago proporcional de dos sueldos para un total a pagar.
    Devuelve un diccionario con los resultados o un error.
    """
    try:
        s1 = float(reemplazar_punto_y_coma(sueldo1))
        s2 = float(reemplazar_punto_y_coma(sueldo2))
        total = float(reemplazar_punto_y_coma(total_a_pagar))
    except Exception as e:
        logger.error(f"Error de conversión en calcular_cuentas: {e}")
        return {"error": "Por favor, ingrese únicamente valores numéricos"}

    suma_sueldos = s1 + s2
    if suma_sueldos < total:
        logger.warning(f"El monto total a pagar ({total}) supera la suma de los sueldos ({suma_sueldos})")
        return {"error": "El monto total a pagar no puede superar la suma de los sueldos"}

    primer_porcentaje = (s1 * 100) / suma_sueldos
    segundo_porcentaje = (s2 * 100) / suma_sueldos

    def formatear_con_puntos(valor):
        """
        Formatea un número agregando puntos como separador de miles.
        Ejemplo: 1200 -> '1.200', 500000 -> '500.000', 1234567.89 -> '1.234.567,89'
        """
        try:
            if isinstance(valor, float):
                entero, decimal = f"{valor:.2f}".split(".")
            else:
                entero = str(int(valor))
                decimal = None
            entero_con_puntos = "{:,}".format(int(entero)).replace(",", ".")
            if decimal is not None:
                return f"{entero_con_puntos},{decimal}"
            else:
                return entero_con_puntos
        except Exception as e:
            logger.error(f"Error en formatear_con_puntos: {e}")
            return str(valor)

    primer_pago = round((total * primer_porcentaje) / 100, 2)
    segundo_pago = round((total * segundo_porcentaje) / 100, 2)

    # Solo formatear los resultados de pago1 y pago2
    primer_pago_formateado = formatear_con_puntos(primer_pago)
    segundo_pago_formateado = formatear_con_puntos(segundo_pago)

    logger.info(f"Cálculo exitoso: sueldo1={s1}, sueldo2={s2}, total={total}, pago1={primer_pago_formateado}, pago2={segundo_pago_formateado}")
    return {
        "sueldo1": s1,
        "sueldo2": s2,
        "total": total,
        "pago1": primer_pago_formateado,
        "pago2": segundo_pago_formateado,
        "porcentaje1": round(primer_porcentaje, 2),
        "porcentaje2": round(segundo_porcentaje, 2)
    }

def cargar_historial():
    """
    Carga el historial de cálculos desde el archivo JSON.
    """
    try:
        if os.path.exists(HISTORIAL_FILE):
            with open(HISTORIAL_FILE, 'r') as f:
                data = json.load(f)
                logger.info(f"Historial cargado correctamente. Registros: {len(data)}")
                return data
        logger.info("No existe historial, devolviendo lista vacía.")
        return []
    except Exception as e:
        logger.error(f"Error al cargar historial: {e}")
        return []

def guardar_historial(historial):
    """
    Guarda el historial de cálculos en el archivo JSON.
    """
    try:
        with open(HISTORIAL_FILE, 'w') as f:
            json.dump(historial, f)
        logger.info(f"Historial guardado correctamente. Registros: {len(historial)}")
    except Exception as e:
        logger.error(f"Error al guardar historial: {e}")

def agregar_a_historial(sueldo1, sueldo2, total_a_pagar):
    """
    Realiza el cálculo y lo agrega al historial.
    Devuelve el registro agregado o un error.
    """
    resultado = calcular_cuentas(sueldo1, sueldo2, total_a_pagar)
    if "error" in resultado:
        logger.warning(f"No se agregó al historial por error: {resultado['error']}")
        return resultado

    historial = cargar_historial()
    ultimo_id = 0
    if historial:
        ultimo_id = max(int(registro["id"]) for registro in historial)

    registro = {
        "id": str(ultimo_id + 1),
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        "sueldo1": str(resultado["sueldo1"]),
        "sueldo2": str(resultado["sueldo2"]),
        "total": str(resultado["total"]),
        "pago1": str(resultado["pago1"]),
        "pago2": str(resultado["pago2"])
    }
    historial.append(registro)
    guardar_historial(historial)
    logger.info(f"Registro agregado al historial: {registro}")
    return registro

def obtener_historial():
    """
    Devuelve el historial completo de cálculos.
    """
    return cargar_historial()

def eliminar_registro_historial(id_registro):
    """
    Elimina un registro del historial por su ID.
    Devuelve True si se eliminó, False si no se encontró.
    """
    historial = cargar_historial()
    nuevo_historial = [r for r in historial if r["id"] != str(id_registro)]
    if len(nuevo_historial) == len(historial):
        logger.warning(f"Intento de eliminar registro inexistente: id={id_registro}")
        return False
    guardar_historial(nuevo_historial)
    logger.info(f"Registro eliminado del historial: id={id_registro}")
    return True

