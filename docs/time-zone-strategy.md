# Time-Zone Strategy

The client submits an instant, preferably an ISO string with a `Z` suffix or explicit offset.

The gateway stores the normalized UTC instant.

The transaction processor maps the selected region to an IANA time zone:

| Region | IANA time zone |
| --- | --- |
| `IL` | `Asia/Jerusalem` |
| `US_EAST` | `America/New_York` |
| `UK` | `Europe/London` |
| `EU_CENTRAL` | `Europe/Berlin` |

Approval rule:

```text
Approved when local time is >= 08:00:00 and < 18:00:00.
Rejected otherwise.
```

Because the input is an instant, daylight-saving-time conversion is unambiguous.

