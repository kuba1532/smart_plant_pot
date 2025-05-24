"""
MicroPython BH1750 - sterownik czujnika natężenia światła
"""
from machine import I2C
import time

class BH1750:
    """Klasa do obsługi czujnika natężenia światła BH1750"""
    
    # Komendy
    POWER_DOWN = 0x00
    POWER_ON = 0x01
    RESET = 0x07
    
    # Tryby pomiaru
    CONTINUOUS_HIGH_RES_MODE = 0x10
    CONTINUOUS_HIGH_RES_MODE_2 = 0x11
    CONTINUOUS_LOW_RES_MODE = 0x13
    ONE_TIME_HIGH_RES_MODE = 0x20
    ONE_TIME_HIGH_RES_MODE_2 = 0x21
    ONE_TIME_LOW_RES_MODE = 0x23

    def __init__(self, i2c, addr=0x23):
        """
        Inicjalizacja czujnika BH1750
        
        Args:
            i2c: Obiekt I2C
            addr: Adres I2C (0x23 gdy ADDR=GND, 0x5C gdy ADDR=VCC)
        """
        self.i2c = i2c
        self.addr = addr
        self.power_on()
        self.set_mode(self.CONTINUOUS_HIGH_RES_MODE)

    def _write(self, command):
        """Wysyła komendę do czujnika"""
        try:
            self.i2c.writeto(self.addr, bytes([command]))
            return True
        except:
            return False

    def power_on(self):
        """Włącza czujnik"""
        return self._write(self.POWER_ON)

    def power_off(self):
        """Wyłącza czujnik"""
        return self._write(self.POWER_DOWN)

    def reset(self):
        """Resetuje czujnik"""
        success = self.power_on()
        if success:
            return self._write(self.RESET)
        return False

    def set_mode(self, mode):
        """Ustawia tryb pomiaru"""
        return self._write(mode)

    def get_result(self):
        """Odczytuje surowy wynik pomiaru"""
        try:
            data = self.i2c.readfrom(self.addr, 2)
            return (data[0] << 8) | data[1]
        except:
            return None

    @property
    def luminance(self):
        """
        Odczytuje natężenie światła w luxach
        
        Returns:
            float: Natężenie światła w luxach lub None w przypadku błędu
        """
        try:
            raw = self.get_result()
            if raw is not None:
                return raw / 1.2  # Konwersja na luxy
            return None
        except:
            return None

    def measure(self, mode=None):
        """
        Wykonuje pojedynczy pomiar w wybranym trybie
        
        Args:
            mode: Tryb pomiaru (domyślnie None - użyje bieżącego trybu)
            
        Returns:
            float: Natężenie światła w luxach lub None w przypadku błędu
        """
        if mode is not None:
            self.set_mode(mode)
        
        # Czekaj odpowiedni czas w zależności od trybu
        if mode in (self.ONE_TIME_HIGH_RES_MODE, self.ONE_TIME_HIGH_RES_MODE_2, self.CONTINUOUS_HIGH_RES_MODE, self.CONTINUOUS_HIGH_RES_MODE_2):
            time.sleep_ms(180)  # Tryb wysokiej rozdzielczości
        else:
            time.sleep_ms(24)   # Tryb niskiej rozdzielczości
            
        return self.luminance 
