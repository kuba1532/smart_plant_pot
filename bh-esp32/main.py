from machine import Pin, ADC, I2C, RTC, PWM
import time
import network
import ssl
from umqtt.simple import MQTTClient
import json
import bh1750
import random
import utime
import ntptime
import dht
import machine

# Konfiguracja MQTT
MQTT_BROKER = "dc15301e.ala.eu-central-1.emqxsl.com"
MQTT_PORT = 8883
MQTT_CLIENT_ID = "device0"
MQTT_USERNAME = "test"
MQTT_PASSWORD = "test"

# Tematy MQTT
READINGS_TOPIC = b"device/0/readings/sendReading"
SETTINGS_TOPIC = b"device/0/settings/changeSettings"
SETTINGS_REQUEST_TOPIC = b"device/0/settings/requestSettings"  # Nowy temat do wysyłania ustawień
COMMAND_TOPIC = b"device/0/command/sendCommand"

# Tematy MQTT dla czujników
WEATHER_TOPIC = b"device/0/sensors/weather"
SOIL_TOPIC = b"device/0/sensors/soil"
LIGHT_TOPIC = b"device/0/sensors/light"

# Tematy do subskrypcji
TOPICS = [
    b"device/0/settings/changeSettings",
    b"device/0/command/sendCommand",
    b"device/0/settings/requestSettings"  # Dodajemy nowy temat
]

# Konfiguracja pinów
RELAY_PIN = 32  # Zmieniamy na GPIO 32
SOIL_SENSOR_PIN = 35
MH_SENSOR_PIN = 34  # Pin dla czujnika MH
LED_PIN = 32       # Pin dla diody LED
I2C_SCL_PIN = 22   # Pin SCL dla BH1750
I2C_SDA_PIN = 21   # Pin SDA dla BH1750
RGB_RED_PIN = 16   # Pin dla czerwonego koloru RGB LED
RGB_GREEN_PIN = 17 # Pin dla zielonego koloru RGB LED
RGB_BLUE_PIN = 18  # Pin dla niebieskiego koloru RGB LED
DHT_PIN = 25       # Pin dla czujnika DHT11

# Kalibracja czujników
SOIL_MAX = 4095  # Wartość dla suchej gleby (0%)
SOIL_MIN = 700   # Wartość dla mokrej gleby (100%)
MH_MIN = 0      # Wartość dla 0% wilgotności
MH_MAX = 4095   # Wartość dla 100% wilgotności

# Domyślne ustawienia
MOISTURE_THRESHOLD = 30  # Domyślny próg wilgotności gleby (%)

# Domyślne ustawienia
DEFAULT_SETTINGS = {
    "MaxHumidity": 70,
    "MinHumidity": 40,
    "MaxBrightness": 800,
    "MinBrightness": 200,
    "BrightPeriodStart": "07:00:00",
    "BrightPeriodEnd": "02:00:00"
}

# Aktualne ustawienia
current_settings = DEFAULT_SETTINGS.copy()

# Inicjalizacja pinów
print("Inicjalizacja przekaźnika...")
relay = Pin(RELAY_PIN, Pin.OUT, value=1)  # Ustawiamy początkową wartość na 1 (wyłączony)
print("Przekaźnik zainicjalizowany")
soil_sensor = ADC(Pin(SOIL_SENSOR_PIN))
soil_sensor.atten(ADC.ATTN_11DB)  # Pełny zakres 3.3V
soil_sensor.width(ADC.WIDTH_12BIT)  # 12-bitowa rozdzielczość
mh_sensor = ADC(Pin(MH_SENSOR_PIN))
led = Pin(LED_PIN, Pin.OUT)
dht_sensor = dht.DHT11(Pin(DHT_PIN))

# Inicjalizacja I2C i BH1750
i2c = I2C(0, scl=Pin(I2C_SCL_PIN), sda=Pin(I2C_SDA_PIN))
light_sensor = bh1750.BH1750(i2c)

# Inicjalizacja RGB LED
rgb_red = PWM(Pin(RGB_RED_PIN))
rgb_green = PWM(Pin(RGB_GREEN_PIN))
rgb_blue = PWM(Pin(RGB_BLUE_PIN))

# Konfiguracja PWM dla RGB LED
rgb_red.freq(1000)
rgb_green.freq(1000)
rgb_blue.freq(1000)

# Domyślne stany - przekaźnik wyłączony (1 = wyłączony, 0 = włączony)
relay.value(1)
led.value(0)  # LED wyłączona
rgb_red.duty(0)  # RGB LED wyłączona
rgb_green.duty(0)
rgb_blue.duty(0)

# Zmienne globalne do śledzenia stanu
watering_end_time = 0
lighting_end_time = 0
last_command_time = 0  # Czas ostatniej otrzymanej komendy
COMMAND_DELAY = 10000  # Opóźnienie w milisekundach (10 sekund) przed wysłaniem nowych odczytów

# Zmienna globalna dla klienta MQTT
mqtt_client = None

def map_value(value, in_min, in_max, out_min, out_max):
    """
    Mapuje wartość z jednego zakresu na inny.
    """
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min

def get_current_time():
    """Zwraca aktualny czas w formacie ISO 8601"""
    try:
        
        current_time = time.localtime()
        print("Debug - Aktualny czas:", current_time)
        
        if current_time[0] < 2024:
            print("UWAGA: Nieprawidłowy rok, próba synchronizacji...")
            sync_time()
            current_time = time.localtime()
            print("Debug - Czas po synchronizacji:", current_time)
        
        year, month, day, hour, minute, second, _, _ = current_time
        return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:{second:02d}Z"
    except Exception as e:
        print(f"Błąd w get_current_time: {e}")
        return "2000-01-01T00:00:00Z"

def get_light_intensity():
    """
    Odczytuje natężenie światła z czujnika BH1750 w luxach.
    """
    try:
        
        readings = []
        for i in range(5):
            raw_value = light_sensor.luminance
            if raw_value is not None:
                readings.append(raw_value)
            time.sleep(0.1)
        
        if not readings:
            print("Nie udało się uzyskać żadnego poprawnego odczytu")
            return 0
            
        
        readings.sort()
        if len(readings) > 2:
            readings = readings[1:-1]  # Usuń najmniejszą i największą wartość
        
        
        avg_light = sum(readings) / len(readings)
        print(f"Odczyt natężenia światła: {avg_light:.1f} lx")
        return avg_light
        
    except Exception as e:
        print(f"Błąd odczytu czujnika światła: {e}")
        return 0

def parse_time(time_str):
    """Konwertuje string czasu na minuty od północy"""
    h, m, s = map(int, time_str.split(':'))
    return h * 60 + m

def save_settings_to_file(settings):
    """
    Zapisuje ustawienia do pliku na urządzeniu.
    """
    try:
        with open('settings.json', 'w') as f:
            json.dump(settings, f)
        print("Ustawienia zapisane do pliku")
    except Exception as e:
        print(f"Błąd podczas zapisywania ustawień: {e}")

def load_settings_from_file():
    """
    Wczytuje ustawienia z pliku na urządzeniu.
    """
    try:
        with open('settings.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Błąd podczas wczytywania ustawień: {e}")
        return DEFAULT_SETTINGS.copy()

def handle_settings_change(settings):
    """Obsługuje zmianę ustawień urządzenia"""
    global current_settings
    try:
        # Aktualizuj tylko te ustawienia, które zostały przekazane
        for key, value in settings.items():
            if key in current_settings:
                current_settings[key] = value
        print("Zaktualizowano ustawienia:", current_settings)
        # Zapisz ustawienia do pliku
        save_settings_to_file(current_settings)
    except Exception as e:
        print("Błąd podczas aktualizacji ustawień:", e)

def handle_command(command):
    """Obsługuje komendy dla urządzenia"""
    global watering_end_time, lighting_end_time, last_command_time
    try:
        current_time = utime.ticks_ms()
        last_command_time = current_time  # Zapisz czas otrzymania komendy
        
        if "WaterFor" in command:
            # Konwertuj czas na milisekundy
            h, m, s = map(int, command["WaterFor"].split(':'))
            water_time = (h * 3600 + m * 60 + s) * 1000  # konwersja na milisekundy
            
            if water_time > 0:
                print(f"Włączam podlewanie na {water_time/1000} sekund")
                # Włącz przekaźnik (0 = włączony, bo jest aktywny przy LOW)
                print("Próba włączenia przekaźnika...")
                relay.value(0)  # LOW = włączony
                print("Przekaźnik WŁĄCZONY (0) - podlewanie rozpoczęte")
                # Ustaw czas zakończenia
                watering_end_time = utime.ticks_add(current_time, water_time)
            else:
                print("Wyłączam podlewanie")
                # Wyłącz przekaźnik (1 = wyłączony, bo jest nieaktywny przy HIGH)
                print("Próba wyłączenia przekaźnika...")
                relay.value(1)  # HIGH = wyłączony
                print("Przekaźnik WYŁĄCZONY (1) - podlewanie zatrzymane")
                watering_end_time = 0
            
        if "IlluminateFor" in command:
            # Konwertuj czas na milisekundy
            h, m, s = map(int, command["IlluminateFor"].split(':'))
            light_time = (h * 3600 + m * 60 + s) * 1000  
            print(f"Włączam oświetlenie na {light_time/1000} sekund")
            
            
            led.value(1)
            set_rgb_color(1023, 1023, 1023)  # Włącz białe światło
            print("LED włączona - oświetlenie rozpoczęte")
            
            
            lighting_end_time = utime.ticks_add(current_time, light_time)
            
    except Exception as e:
        print("Błąd podczas wykonywania komendy:", e)
        
        relay.value(1)  
        led.value(0)
        set_rgb_color(0, 0, 0)

def check_timers():
    """Sprawdza i obsługuje timery dla podlewania i oświetlenia"""
    global watering_end_time, lighting_end_time
    current_time = utime.ticks_ms()
    
    # Sprawdź timer podlewania
    if watering_end_time > 0:
        if utime.ticks_diff(watering_end_time, current_time) <= 0:
            relay.value(1)  
            watering_end_time = 0
            print("Przekaźnik WYŁĄCZONY (1) - podlewanie zakończone")
    
    # Sprawdź timer oświetlenia
    if lighting_end_time > 0:
        if utime.ticks_diff(lighting_end_time, current_time) <= 0:
            led.value(0) 
            lighting_end_time = 0
            print("LED wyłączona - oświetlenie zakończone")

def mqtt_callback(topic, msg):
    """Callback dla wiadomości MQTT"""
    global mqtt_client
    try:
        print(f"Otrzymano wiadomość na temat: {topic}")
        print(f"Treść wiadomości: {msg}")
        
        if topic == SETTINGS_TOPIC:
            settings = json.loads(msg.decode())
            handle_settings_change(settings)
        elif topic == COMMAND_TOPIC:
            command = json.loads(msg.decode())
            handle_command(command)
        elif topic == SETTINGS_REQUEST_TOPIC:
            print("Otrzymano żądanie ustawień, wysyłam odpowiedź...")
            print(f"Aktualne ustawienia: {current_settings}")
            if mqtt_client:
                mqtt_client.publish(SETTINGS_TOPIC, json.dumps(current_settings).encode())
                print(f'Wysłano aktualne ustawienia: {json.dumps(current_settings)}')
            else:
                print("Błąd: Brak połączenia MQTT")
    except Exception as e:
        print(f"Błąd podczas obsługi wiadomości MQTT: {e}")
        print(f"Typ błędu: {type(e)}")

def read_soil_sensor():
    """
    Odczytuje wilgotność gleby z czujnika.
    Zwraca wartość w procentach (0-100).
    Wartość 4095 oznacza suchą glebę (0%)
    Wartość 700 oznacza mokrą glebę (100%)
    """
    try:
        # Wykonaj kilka odczytów i uśrednij je dla stabilności
        readings = []
        for i in range(10):
            raw_value = soil_sensor.read()
            readings.append(raw_value)
            time.sleep(0.1)
        
        # Usuń skrajne wartości
        readings.sort()
        readings = readings[2:-2]  # Usuń 2 najmniejsze i 2 największe wartości
        
        # Oblicz średnią surową wartość
        avg_raw_value = sum(readings) / len(readings)
        
        # Przelicz na procenty
        # SOIL_MAX (4095) = sucha gleba = 0%
        # SOIL_MIN (700) = mokra gleba = 100%
        moisture_percent = int(map_value(avg_raw_value, SOIL_MIN, SOIL_MAX, 100, 0))
        
        # Ogranicz wartość do zakresu 0-100
        moisture_percent = max(0, min(100, moisture_percent))
        
        print(f"Surowe odczyty wilgotności gleby: {readings}")
        print(f"Średnia surowa wartość: {avg_raw_value}")
        print(f"Przeliczona wartość wilgotności: {moisture_percent}%")
        
        return moisture_percent
    except Exception as e:
        print(f"Błąd odczytu czujnika wilgotności gleby: {e}")
        return 0

def set_rgb_color(red, green, blue):
   
    rgb_red.duty(red)
    rgb_green.duty(green)
    rgb_blue.duty(blue)

def update_rgb_light(light_intensity):
   
    if light_intensity < current_settings["MinBrightness"]:
        # Białe światło (wszystkie kolory na maksymalnej intensywności)
        # Wartość 1023 to maksymalna jasność dla 10-bit PWM
        set_rgb_color(1023, 1023, 1023)
    else:
        # Wyłącz RGB LED
        set_rgb_color(0, 0, 0)

def read_temperature():
  
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        print(f"Odczyt temperatury: {temperature}°C")
        return temperature
    except Exception as e:
        print(f"Błąd odczytu temperatury: {e}")
        return 25.0  # Domyślna wartość w przypadku błędu

def read_sensors():
    try:
        # Odczyt czujnika wilgotności gleby
        soil_moisture_percent = read_soil_sensor()
        print(f"Wilgotność gleby: {soil_moisture_percent}%")
        
        # Odczyt natężenia światła z BH1750
        light_intensity = float(get_light_intensity())
        print(f"Natężenie światła: {light_intensity} lx")
        
        # Odczyt temperatury z DHT11
        temperature = read_temperature()
        
        # Sprawdzenie warunków oświetlenia
        current_hour = time.localtime()[3]
        current_minute = time.localtime()[4]
        current_time_minutes = current_hour * 60 + current_minute
        
        bright_start = parse_time(current_settings["BrightPeriodStart"])
        bright_end = parse_time(current_settings["BrightPeriodEnd"])
        
        # Sprawdzenie czy jesteśmy w okresie oświetlenia
        in_bright_period = False
        if bright_end > bright_start:
            in_bright_period = bright_start <= current_time_minutes <= bright_end
        else:  # Przypadek gdy okres przechodzi przez północ
            in_bright_period = current_time_minutes >= bright_start or current_time_minutes <= bright_end
        
        # Automatyczne oświetlenie - niezależne od podlewania
        if light_intensity < current_settings["MinBrightness"] and in_bright_period:
            print(f"Natężenie światła poniżej progu ({current_settings['MinBrightness']} lx) w okresie oświetlenia")
            led.value(1)  # Włącz LED
            set_rgb_color(1023, 1023, 1023)  # Włącz białe światło
        else:
            led.value(0)  # Wyłącz LED
            set_rgb_color(0, 0, 0)  # Wyłącz RGB
        
        # Automatyczne podlewanie
        if soil_moisture_percent < current_settings["MinHumidity"]:
            print(f"Wilgotność poniżej progu ({current_settings['MinHumidity']}%), rozpoczynam podlewanie")
            relay.value(0)  # Włącz przekaźnik
            time.sleep(3)  # Podlewaj przez 10 sekund
            relay.value(1)  # Wyłącz przekaźnik
            print("Podlewanie zakończone")
        else:
            # Upewnij się, że przekaźnik jest wyłączony gdy wilgotność jest powyżej progu
            relay.value(1)  # Wyłącz przekaźnik (HIGH = wyłączony)
            print(f"Wilgotność powyżej progu ({current_settings['MinHumidity']}%), przekaźnik wyłączony")
        
        # Przygotuj dane w wymaganym formacie
        reading_data = {
            "DeviceId": 0,
            "Humidity": float(soil_moisture_percent),
            "LightIntensity": light_intensity,
            "Temperature": float(temperature),
            "Timestamp": get_current_time()
        }
        
        return reading_data
    except Exception as e:
        print(f"Błąd odczytu czujników: {e}")
        # W przypadku błędu upewnij się, że przekaźnik jest wyłączony (HIGH)
        relay.value(1)
        led.value(0)
        set_rgb_color(0, 0, 0)
        return None

# Funkcja do połączenia z MQTT
def connect_mqtt():
    global mqtt_client
    try:
        # Tworzenie kontekstu SSL dla MicroPython
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        
        # Inicjalizacja klienta MQTT
        mqtt_client = MQTTClient(
            client_id=MQTT_CLIENT_ID,
            server=MQTT_BROKER,
            port=MQTT_PORT,
            ssl=ssl_context,
            ssl_params={"server_hostname": MQTT_BROKER},
            user=MQTT_USERNAME,
            password=MQTT_PASSWORD
        )
        
        # Ustawienie callbacka dla wiadomości
        mqtt_client.set_callback(mqtt_callback)
        
        # Połączenie z brokerem
        mqtt_client.connect()
        print('Połączono z brokerem MQTT')
        
        # Subskrypcja do tematów
        for topic in TOPICS:
            mqtt_client.subscribe(topic)
            print(f'Subskrybowano do tematu: {topic}')
        
        return mqtt_client
    except Exception as e:
        print('Błąd połączenia MQTT:', e)
        return None

def sync_time():
    """
    Synchronizuje czas przez NTP i ustawia strefę czasową na polską (UTC+2)
    """
    try:
        print("Rozpoczynam synchronizację czasu...")
        
        # Ustawienie serwera NTP na europejski
        ntptime.host = "pool.ntp.org"
        
        # Próba synchronizacji (do 5 razy)
        for i in range(5):
            try:
                print(f"Próba synchronizacji {i+1}/5...")
                ntptime.settime()
                print("Synchronizacja NTP udana")
                break
            except Exception as e:
                print(f"Błąd próby {i+1}:", e)
                time.sleep(2)
        else:
            print("Nie udało się zsynchronizować czasu po 5 próbach")
            return
        
        # Pobranie aktualnego czasu
        current_time = time.localtime()
        print("Czas przed korektą:", current_time)
        
        # Sprawdzenie czy czas jest sensowny (nie jest z 2000 roku)
        if current_time[0] < 2024:
            print("Otrzymano nieprawidłowy czas, próba ponownej synchronizacji...")
            time.sleep(2)
            ntptime.settime()
            current_time = time.localtime()
            print("Czas po ponownej synchronizacji:", current_time)
        
        # Korekta o strefę czasową (UTC+2)
        year = current_time[0]
        month = current_time[1]
        day = current_time[2]
        hour = (current_time[3] + 2) % 24
        minute = current_time[4]
        second = current_time[5]
        
        # Jeśli przesunięcie godziny powoduje zmianę dnia
        if hour < current_time[3]:  # jeśli przeszliśmy przez północ
            # Oblicz timestamp i dodaj 24h
            t = utime.mktime((year, month, day, current_time[3], minute, second, 0, 0))
            t += 24 * 3600  # dodaj 24h
            new_time = utime.localtime(t)
            year = new_time[0]
            month = new_time[1]
            day = new_time[2]
        
        # Ustawienie nowego czasu
        rtc = RTC()
        rtc.datetime((year, month, day, current_time[6], hour, minute, second, 0))
        
        # Weryfikacja ustawienia czasu
        new_time = time.localtime()
        print("Czas po korekcie:", new_time)
        
        # Ostateczna weryfikacja
        if new_time[0] < 2024:
            print("UWAGA: Czas nadal nieprawidłowy po synchronizacji!")
        else:
            print("Synchronizacja czasu zakończona pomyślnie")
        
    except Exception as e:
        print("Błąd główny synchronizacji czasu:", e)
        print("Szczegóły błędu:", type(e).__name__)

def main():
    # Wczytaj ustawienia z pliku przy starcie
    global current_settings, mqtt_client
    current_settings = load_settings_from_file()
    print("Wczytano ustawienia:", current_settings)
    
    # Upewnij się, że przekaźnik jest wyłączony przy starcie
    relay.value(1)  # Wyłącz przekaźnik (HIGH = wyłączony)
    print("Przekaźnik wyłączony przy starcie")
    
    while True:
        try:
            # Sprawdzenie połączenia WiFi
            wlan = network.WLAN(network.STA_IF)
            if not wlan.isconnected():
                print("Brak połączenia WiFi, próba ponownego połączenia...")
                wlan.active(False)
                time.sleep(1)
                wlan.active(True)
                time.sleep(1)
                wlan.connect(WIFI_SSID, WIFI_PASSWORD)
                
                max_wait = 20
                while max_wait > 0:
                    if wlan.isconnected():
                        print("Połączono z WiFi!")
                        # Sprawdź stabilność połączenia
                        for _ in range(3):
                            if not wlan.isconnected():
                                print("Połączenie WiFi niestabilne, ponowna próba...")
                                break
                            time.sleep(1)
                        else:
                            print("Połączenie WiFi stabilne, rozpoczynam synchronizację czasu...")
                            time.sleep(2)  # Dodatkowe opóźnienie dla stabilności
                            sync_time()
                            break
                    max_wait -= 1
                    print("Czekam na połączenie WiFi...")
                    time.sleep(1)
                
                if not wlan.isconnected():
                    print("Nie udało się połączyć z WiFi, ponowna próba za 10 sekund...")
                    time.sleep(10)
                    continue
            
            # Połączenie z MQTT
            mqtt_client = connect_mqtt()
            if mqtt_client is None:
                print("Błąd połączenia MQTT, ponowna próba za 10 sekund...")
                time.sleep(10)
                continue
            
            while True:
                try:
                    current_time = utime.ticks_ms()
                    
                    # Sprawdzenie nowych wiadomości
                    mqtt_client.check_msg()
                    
                    
                    check_timers()
                    
                    # Sprawdź czy minęło wystarczająco czasu od ostatniej komendy
                    if last_command_time == 0 or utime.ticks_diff(current_time, last_command_time) > COMMAND_DELAY:
                        # Odczyt czujników
                        reading_data = read_sensors()
                        if reading_data:
                            # Wysłanie odczytów
                            mqtt_client.publish(READINGS_TOPIC, json.dumps(reading_data).encode())
                            print(f'Wysłano odczyty: {json.dumps(reading_data)}')
                    else:
                        print("Czekam na stabilizację odczytów po komendzie...")
                    
                    time.sleep(5)  # Odczyt co 5 sekund
                except Exception as e:
                    print('Błąd podczas wysyłania:', e)
                    break
        except Exception as e:
            print('Błąd główny:', e)
        finally:
            try:
                if mqtt_client:
                    mqtt_client.disconnect()
            except:
                pass
            print("Ponowna próba połączenia za 10 sekund...")
            time.sleep(10)

if __name__ == "__main__":
    main() 






