# ESP32 Internet Watchdog

An automated internet monitoring and recovery system using an ESP32 microcontroller to detect internet outages and perform sequential power cycling of your router and Eero mesh network.

## Overview

This project monitors internet connectivity by pinging reliable external servers (Google DNS and Cloudflare). When connectivity failures are detected, it automatically power cycles your networking equipment in the correct sequence to restore internet access.

### How It Works

1. **Monitoring**: The ESP32 pings `8.8.8.8` (Google) and `1.1.1.1` (Cloudflare) every 5 minutes
2. **Failure Detection**: If both pings fail 3 consecutive times, a reboot sequence is triggered
3. **Sequential Power Cycle**:
   - Power OFF both router and mesh
   - Wait 10 seconds
   - Power ON the router first
   - Wait 2 minutes for router to fully boot
   - Power ON the Eero mesh network
4. **Recovery**: System resumes normal monitoring

## Hardware Requirements

| Component | Description | Link |
|-----------|-------------|------|
| ESP32 Starter Kit | ESP32 development board with accessories | [Amazon](https://www.amazon.com/dp/B0DDPQ45W6/) |
| Mini Breadboards | For prototyping connections | [Amazon](https://www.amazon.com/dp/B0BXKMBRZ4/) |
| Project Box | Enclosure for finished project | [Amazon](https://www.amazon.com/dp/B08N1DD5WJ/) |
| 2x IoT Power Relay | Controls AC power to router/mesh | [Amazon](https://www.amazon.com/dp/B0DJD5VMLG/) |
| Power Cord | Power supply for relay modules | [Amazon](https://www.amazon.com/dp/B07C9D6CXY/) |

## Wiring Diagram

```
ESP32                    IoT Relay 1 (Router)     IoT Relay 2 (Mesh)
┌─────────┐              ┌─────────────┐          ┌─────────────┐
│         │              │             │          │             │
│  GPIO17 ├──────────────┤ IN1 (Signal)│          │             │
│         │              │             │          │             │
│  GPIO27 ├──────────────┼─────────────┼──────────┤ IN2 (Signal)│
│         │              │             │          │             │
│     GND ├──────────────┤ GND         │          │ GND         │
│         │              │             │          │             │
│     3V3 ├──────────────┤ VCC         │          │ VCC         │
│         │              │             │          │             │
└─────────┘              │    AC OUT ──┼── Router │    AC OUT ──┼── Eero Mesh
                         └─────────────┘          └─────────────┘
```

### Pin Assignments

| ESP32 Pin | Connection | Purpose |
|-----------|------------|---------|
| GPIO 17 | Relay 1 IN | Router power control |
| GPIO 27 | Relay 2 IN | Eero Mesh power control |
| GND | Relay GND | Common ground |
| 3V3 | Relay VCC | Relay power supply |

## Software Setup

### Prerequisites

- [VS Code](https://code.visualstudio.com/)
- [PlatformIO Extension](https://platformio.org/install/ide?install=vscode)

### Configuration

1. **Create secrets file** - Copy the template and add your WiFi credentials:

   ```bash
   cp src/secrets.h.example src/secrets.h
   ```

2. **Edit `src/secrets.h`**:

   ```cpp
   #define SECRET_SSID "YourWiFiNetworkName"
   #define SECRET_PASS "YourWiFiPassword"
   ```

3. **Adjust timing parameters** in `src/main.cpp` if needed:

   ```cpp
   const int PING_INTERVAL_MINS = 5;     // Check every 5 minutes
   const int REBOOT_DELAY_MS    = 120000; // 2 min wait for router boot
   const int MAX_FAILURES       = 3;      // Failures before rebooting
   ```

### Building & Uploading

```bash
# Build the project
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output
pio device monitor
```

## Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `PING_INTERVAL_MINS` | 5 | Minutes between connectivity checks |
| `REBOOT_DELAY_MS` | 120000 | Milliseconds to wait for router boot (2 min) |
| `MAX_FAILURES` | 3 | Consecutive failures before triggering reboot |
| `RELAY_ROUTER` | GPIO 17 | Pin controlling router relay |
| `RELAY_MESH` | GPIO 27 | Pin controlling mesh relay |

## Relay Logic

Most IoT relays use **active-low** logic:

| Signal | Relay State | Power |
|--------|-------------|-------|
| LOW (0V) | Closed | ON |
| HIGH (3.3V) | Open | OFF |

> ⚠️ **Important**: Verify your relay's logic before connecting expensive equipment. Some relays may use active-high logic.

## Serial Monitor Output

```
Connecting to WiFi...
WiFi Connected!
Internet is ALIVE.
Internet is ALIVE.
Internet FAIL detected. Failure 1 of 3
Internet FAIL detected. Failure 2 of 3
Internet FAIL detected. Failure 3 of 3
!!! CRITICAL: Internet Failure. Starting Sequenced Reboot !!!
Powering on Router...
Waiting 2 minutes for Router sequence...
Powering on Mesh Network...
Reboot Cycle Complete.
Internet is ALIVE.
```

## Safety Considerations

⚠️ **WARNING: This project involves AC mains voltage (120V/240V)**

- Always disconnect power before making wiring changes
- Use properly rated relay modules for your voltage/current requirements
- Ensure all connections are secure and properly insulated
- Consider using a GFCI-protected outlet
- Keep the project box away from water and moisture
- If unsure, consult a licensed electrician

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| ESP32 won't connect to WiFi | Wrong credentials | Check `secrets.h` |
| Relays not switching | Wrong GPIO pins | Verify wiring matches code |
| Relays always ON/OFF | Inverted logic | Swap HIGH/LOW in code |
| False positives | Network congestion | Increase `MAX_FAILURES` |
| Router not fully booting | Insufficient delay | Increase `REBOOT_DELAY_MS` |

## Project Structure

```
ESP32-Internet-Watchdog/
├── src/
│   ├── main.cpp          # Main application code
│   └── secrets.h         # WiFi credentials (gitignored)
├── include/
│   └── README            # Include directory info
├── lib/
│   └── README            # Library directory info
├── test/
│   └── README            # Test directory info
├── platformio.ini        # PlatformIO configuration
└── README.md             # This file
```

## License

MIT License - Feel free to use and modify for your own projects.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
