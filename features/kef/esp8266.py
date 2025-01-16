import network
from umqtt.simple import MQTTClient
import time
import machine

wlan = None


def connectWifi():
    global wlan
    wlan = network.WLAN(network.WLAN.IF_STA)
    wlan.active(True)
    if not wlan.isconnected():
        print("connecting to network...")
        wlan.connect("ssid", "key")
        while not wlan.isconnected():
            pass
    print("network config:", wlan.ipconfig("addr4"))


def main():
    while True:

        if not wlan.isConnected():
            try:
                connectWifi()
            except:
                print("Unable to connect to wifi")
                time.sleep(100)
                machine.reset()

        try:
            client = MQTTClient("kef_checker", "192.168.178.29")
            client.connect()
            time.localtime()
            client.publish(b"foo_topic", b"hello")
            client.disconnect()
        except:
            pass

        time.sleep(10)


if __name__ == "__main__":
    main()
