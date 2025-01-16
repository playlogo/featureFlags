import socket
import struct


def get_ntp_timestamp(ntp_server="pool.ntp.org"):
    NTP_PACKET_FORMAT = "!12I"
    NTP_DELTA = 2208988800

    request_packet = b"\x1b" + 47 * b"\0"

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    # Set a timeout (optional, adjust as needed)
    s.settimeout(5)

    # Send the request to the NTP server
    s.sendto(request_packet, socket.getaddrinfo(ntp_server, 123)[0][-1])

    # Wait for the response
    response_packet, _ = s.recvfrom(48)

    # Unpack the response and extract the integer part of the timestamp (seconds since 1900)
    response = struct.unpack(NTP_PACKET_FORMAT, response_packet)
    ntp_time = response[10]  # Whole seconds since 1900-01-01

    # Convert to UNIX timestamp (seconds since 1970-01-01)
    unix_time = ntp_time - NTP_DELTA

    return unix_time
