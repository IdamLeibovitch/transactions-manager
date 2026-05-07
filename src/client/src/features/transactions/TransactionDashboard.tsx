import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PublicIcon from '@mui/icons-material/Public'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

const approvedTransactions = [
  {
    id: 'TX-1024',
    merchant: 'Terminal 42',
    amount: 'ILS 125.50',
    region: 'Israel',
    localTime: '12:30',
  },
  {
    id: 'TX-1025',
    merchant: 'North Market',
    amount: 'USD 44.20',
    region: 'US East',
    localTime: '09:15',
  },
]

export function TransactionDashboard() {
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography component="h2" sx={{ fontWeight: 700 }} variant="h4">
          Submit transaction
        </Typography>
        <Typography color="text.secondary">
          Submitted instants are evaluated against local banking hours in the selected region.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Amount" placeholder="125.50" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Currency" placeholder="ILS" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Merchant name" placeholder="Terminal 42" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="region-label">Region</InputLabel>
                  <Select defaultValue="IL" label="Region" labelId="region-label">
                    <MenuItem value="IL">Israel</MenuItem>
                    <MenuItem value="US_EAST">US East</MenuItem>
                    <MenuItem value="UK">United Kingdom</MenuItem>
                    <MenuItem value="EU_CENTRAL">EU Central</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Submitted instant"
                  placeholder="2026-05-07T09:30:00Z"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button startIcon={<SendIcon />} variant="contained">
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, height: '100%' }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <ScheduleIcon color="secondary" />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Banking hours</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Approved from 08:00 through 17:59 local time.
                  </Typography>
                </Box>
              </Stack>
              <Divider />
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <PublicIcon color="primary" />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Selected region decides the local time</Typography>
                  <Typography color="text.secondary" variant="body2">
                    The backend stores every submission and only approved transactions appear below.
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
        >
          <Typography component="h2" sx={{ fontWeight: 700 }} variant="h5">
            Approved transactions
          </Typography>
          <Chip color="success" icon={<CheckCircleIcon />} label="Live updates pending" />
        </Stack>

        <Grid container spacing={2}>
          {approvedTransactions.map((transaction) => (
            <Grid key={transaction.id} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 700 }}>{transaction.merchant}</Typography>
                      <Chip color="success" label="Approved" size="small" />
                    </Stack>
                    <Typography color="text.secondary">{transaction.id}</Typography>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Typography>{transaction.amount}</Typography>
                      <Typography color="text.secondary">
                        {transaction.region} · {transaction.localTime}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  )
}
