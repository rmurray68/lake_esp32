# Configuration & Tuning Guide

Fine-tune the ESP32 Internet Watchdog for your specific network environment.

## Understanding the Parameters

### PING_INTERVAL_MINS (Default: 5)

How often the system checks internet connectivity.

| Value | Use Case |
|-------|----------|
| 1-2 min | Critical uptime requirements |
| 5 min | **Recommended** - balanced monitoring |
| 10-15 min | Low priority, reduce false positives |

**Trade-offs**:
- Lower = Faster detection, more network traffic, potential false positives
- Higher = Slower detection, less traffic, more reliable

### MAX_FAILURES (Default: 3)

Consecutive failures required before triggering a reboot.

| Value | Behavior |
|-------|----------|
| 1 | Aggressive - reboot on first failure |
| 3 | **Recommended** - tolerates brief outages |
| 5+ | Conservative - only reboot on extended outages |

**With 5-minute intervals**:
- MAX_FAILURES=3 means reboot after ~15 minutes of downtime
- MAX_FAILURES=5 means reboot after ~25 minutes of downtime

### REBOOT_DELAY_MS (Default: 120000 / 2 minutes)

Time to wait for router to fully boot before powering on mesh.

| Router Type | Recommended Delay |
|-------------|-------------------|
| Basic router | 60,000 (1 min) |
| ISP gateway | 120,000 (2 min) |
| Advanced router | 180,000 (3 min) |

**How to determine**: 
1. Manually power cycle your router
2. Time how long until it gets WAN IP and passes traffic
3. Add 30 seconds buffer

## Network-Specific Configurations

### Cable/Fiber Internet

```cpp
const int PING_INTERVAL_MINS = 5;
const int REBOOT_DELAY_MS    = 120000; // 2 minutes
const int MAX_FAILURES       = 3;
```

### DSL Internet

DSL modems take longer to sync:

```cpp
const int PING_INTERVAL_MINS = 5;
const int REBOOT_DELAY_MS    = 180000; // 3 minutes
const int MAX_FAILURES       = 4;
```

### Satellite Internet (Starlink, HughesNet)

Higher latency and more variable:

```cpp
const int PING_INTERVAL_MINS = 10;
const int REBOOT_DELAY_MS    = 300000; // 5 minutes
const int MAX_FAILURES       = 5;
```

### Remote/Cabin Location (Your Use Case)

For unreliable connections where you can't manually intervene:

```cpp
const int PING_INTERVAL_MINS = 5;
const int REBOOT_DELAY_MS    = 150000; // 2.5 minutes
const int MAX_FAILURES       = 3;
```

## Ping Target Selection

The default targets are highly reliable:

```cpp
bool googleUp = Ping.ping("8.8.8.8", 3);      // Google DNS
bool cloudflareUp = Ping.ping("1.1.1.1", 3);  // Cloudflare DNS
```

### Alternative Targets

| IP | Provider | Notes |
|----|----------|-------|
| 8.8.8.8 | Google DNS | Extremely reliable |
| 1.1.1.1 | Cloudflare | Extremely reliable |
| 9.9.9.9 | Quad9 | Good alternative |
| 208.67.222.222 | OpenDNS | Good alternative |

### Custom Target (Your ISP Gateway)

For more accurate "internet is up" detection:

```cpp
bool ispUp = Ping.ping("your.isp.gateway.ip", 3);
```

## Relay Timing Adjustments

### Power-Off Duration

Default 10 seconds may not be enough for all devices:

```cpp
// In performReboot()
digitalWrite(RELAY_ROUTER, HIGH); 
digitalWrite(RELAY_MESH, HIGH);
delay(10000); // Increase to 15000-30000 for stubborn devices
```

### Eero Mesh Startup Delay

After router is up, mesh needs time to connect:

```cpp
// After mesh powers on, add settling time
digitalWrite(RELAY_MESH, LOW);
delay(60000); // Wait 1 minute for mesh to connect to router
```

## Advanced: Add Status LED

Add visual feedback without serial monitor:

```cpp
const int STATUS_LED = 2; // Built-in LED on most ESP32 boards

void setup() {
  pinMode(STATUS_LED, OUTPUT);
  // ... existing code
}

void loop() {
  // Blink patterns:
  // - Steady: Internet OK
  // - Slow blink: Checking
  // - Fast blink: Failure detected
  // - Off: Rebooting
  
  if (failureCount == 0) {
    digitalWrite(STATUS_LED, HIGH); // Solid = OK
  } else {
    // Blink faster as failures increase
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  }
  // ... existing code
}
```

## Advanced: Add Watchdog Timer

Protect against ESP32 crashes:

```cpp
#include <esp_task_wdt.h>

void setup() {
  // Initialize watchdog - reset if no feed for 60 seconds
  esp_task_wdt_init(60, true);
  esp_task_wdt_add(NULL);
  // ... existing code
}

void loop() {
  esp_task_wdt_reset(); // Feed the watchdog
  // ... existing code
}
```

## Recommended Settings Summary

### For Lake House / Remote Location

```cpp
// Balanced for reliability without unnecessary reboots
const int PING_INTERVAL_MINS = 5;    
const int REBOOT_DELAY_MS    = 150000; // 2.5 min for ISP router
const int MAX_FAILURES       = 3;      // ~15 min before reboot

// Consider longer delays for Eero mesh
// Eero needs time to discover and connect to router
```

### Test Your Settings

1. Deploy with conservative settings (higher delays, more failures allowed)
2. Monitor via serial or remote logging for 1-2 weeks
3. Adjust based on observed behavior
4. If false positives occur, increase MAX_FAILURES
5. If recovery is too slow, decrease delays
