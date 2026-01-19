# Hardware Assembly Guide

Detailed instructions for assembling the ESP32 Internet Watchdog.

## Components Checklist

- [ ] ESP32 Development Board
- [ ] 2x IoT Power Relay Modules
- [ ] Mini Breadboard
- [ ] Jumper Wires (Male-to-Female recommended)
- [ ] Power Cord with exposed ends
- [ ] Project Enclosure Box
- [ ] USB Cable for ESP32 programming

## Step-by-Step Assembly

### Step 1: Prepare the Workspace

1. Clear a clean, dry workspace
2. Ensure AC power is **disconnected** during assembly
3. Have all components and tools ready

### Step 2: Wire the ESP32 to Relays

#### Relay 1 (Router Control)

| ESP32 Pin | Relay 1 Terminal |
|-----------|------------------|
| GPIO 17 | IN (Signal) |
| GND | GND |
| 3V3 | VCC |

#### Relay 2 (Eero Mesh Control)

| ESP32 Pin | Relay 2 Terminal |
|-----------|------------------|
| GPIO 27 | IN (Signal) |
| GND | GND |
| 3V3 | VCC |

> **Tip**: You can daisy-chain GND and VCC connections between relays.

### Step 3: Test Before AC Connection

1. Connect ESP32 to computer via USB
2. Upload the firmware using PlatformIO
3. Open Serial Monitor at 115200 baud
4. Verify WiFi connection succeeds
5. Verify relay clicks can be heard during test

### Step 4: AC Wiring (⚠️ CAUTION)

**IMPORTANT**: If you're not comfortable working with AC mains voltage, consult an electrician.

#### IoT Relay Module Connections

Most IoT relay modules have screw terminals:

```
┌─────────────────────────────────────┐
│  IoT RELAY MODULE                   │
│                                     │
│  [AC IN]  ←── From Wall Outlet      │
│  [AC OUT] ──→ To Device (Router)    │
│                                     │
│  [VCC] [GND] [IN]                   │
│    │     │    │                     │
│    └─────┴────┴── To ESP32          │
└─────────────────────────────────────┘
```

1. **AC IN**: Connect the power cord from wall outlet
2. **AC OUT**: Connect to router/mesh power adapter
3. Repeat for second relay module

### Step 5: Enclosure Assembly

1. Drill holes for:
   - USB port access (ESP32 programming/power)
   - Power cord entry/exit
   - Optional: ventilation holes
   
2. Mount components:
   - Secure ESP32 with standoffs or adhesive
   - Mount relay modules with screws
   - Use cable ties for wire management

3. Label connections:
   - "ROUTER" on Relay 1 output
   - "MESH" on Relay 2 output

## Wiring Diagram (Visual)

```
                                    ┌─────────────────┐
    ┌──────────────────────────────►│   WALL OUTLET   │
    │                               └────────┬────────┘
    │                                        │
    │    ┌───────────────────────────────────┤
    │    │                                   │
    │    ▼                                   ▼
    │  ┌─────────────┐               ┌─────────────┐
    │  │   RELAY 1   │               │   RELAY 2   │
    │  │  (Router)   │               │   (Mesh)    │
    │  │             │               │             │
    │  │ IN GND VCC  │               │ IN GND VCC  │
    │  └──┬───┬───┬──┘               └──┬───┬───┬──┘
    │     │   │   │                     │   │   │
    │     │   │   └─────────────────────┼───┼───┘
    │     │   └─────────────────────────┼───┘
    │     │                             │
    │     │   ┌─────────────────────────┘
    │     │   │
    │  ┌──▼───▼──┐
    │  │  ESP32  │
    │  │         │
    │  │ GPIO17  │──► Relay 1 IN
    │  │ GPIO27  │──► Relay 2 IN
    │  │ GND     │──► Common Ground
    │  │ 3V3     │──► Common VCC
    │  │         │
    │  │  USB    │◄── Power/Programming
    │  └─────────┘
    │
    │  ┌─────────────┐               ┌─────────────┐
    └──┤   ROUTER    │               │  EERO MESH  │
       │             │               │             │
       └─────────────┘               └─────────────┘
```

## Testing Procedure

### Initial Power-On Test

1. Disconnect router and mesh from relays
2. Power on ESP32 via USB
3. Monitor serial output for WiFi connection
4. Listen for relay clicks during boot

### Relay Function Test

Add this test code temporarily to verify relay operation:

```cpp
void setup() {
  Serial.begin(115200);
  pinMode(17, OUTPUT);
  pinMode(27, OUTPUT);
  
  // Both ON
  digitalWrite(17, LOW);
  digitalWrite(27, LOW);
  Serial.println("Both relays ON");
  delay(3000);
  
  // Router OFF
  digitalWrite(17, HIGH);
  Serial.println("Router relay OFF");
  delay(3000);
  
  // Router ON, Mesh OFF
  digitalWrite(17, LOW);
  digitalWrite(27, HIGH);
  Serial.println("Router ON, Mesh OFF");
  delay(3000);
  
  // Both ON
  digitalWrite(27, LOW);
  Serial.println("Both relays ON");
}

void loop() {}
```

### Full System Test

1. Connect router and mesh to relays
2. Verify normal internet operation
3. Manually trigger a reboot by temporarily blocking internet
4. Observe the sequential power cycle
5. Verify internet recovers automatically

## Common Issues

### Relay Clicking But Not Switching Power

- Check AC wiring connections
- Verify relay is rated for your voltage (120V/240V)
- Test relay with a lamp first

### ESP32 Resets During Relay Switch

- Add a capacitor (100µF) across ESP32 VCC/GND
- Use separate power supply for relays
- Check for voltage drops

### WiFi Connection Unstable

- Move ESP32 away from relay modules (EMI interference)
- Add shielding around relay modules
- Use external antenna ESP32 variant

## Safety Reminders

1. **Never work on AC wiring while powered**
2. **Use properly rated components**
3. **Secure all connections**
4. **Test with low-power devices first**
5. **Keep away from water/moisture**
6. **Ensure adequate ventilation**
