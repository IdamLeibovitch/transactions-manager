import { Box } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider as DatePickerLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker'
import type { Dayjs } from 'dayjs'

type StaticTransactionTimePickerProps = {
  onChange: (value: Dayjs | null) => void
  value: Dayjs | null
}

const StaticTimePickerFrame = styled(Box)(({ theme }) => ({
  '& .MuiClock-clock': {
    backgroundColor: alpha(theme.palette.primary.main, 0.07),
  },
  '& .MuiDialogActions-root': {
    display: 'none',
  },
  '& .MuiPickersLayout-root': {
    backgroundColor: 'transparent',
    display: 'block',
    minWidth: 0,
  },
  '& .MuiPickersLayout-contentWrapper': {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  '& .MuiPickersToolbar-content': {
    justifyContent: 'center',
  },
  '& .MuiPickersToolbar-root': {
    maxWidth: 260,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingBottom: 0,
    paddingTop: 0,
  },
  '& .MuiPickersToolbar-title': {
    display: 'none',
  },
  '& .MuiTimeClock-arrowSwitcher': {
    justifyContent: 'space-between',
    left: 0,
    right: 0,
    top: 4,
  },
  '& .MuiTimeClock-root': {
    height: 232,
    maxHeight: 232,
    marginLeft: 'auto',
    marginRight: 'auto',
    overflow: 'hidden',
    width: 280,
  },
  '& .MuiTimeClock-root .MuiClock-root': {
    margin: '0 auto',
  },
  '& .MuiTypography-overline': {
    color: theme.palette.text.secondary,
    fontSize: 11,
    lineHeight: 1.2,
    marginBottom: theme.spacing(0.5),
  },
}))

export function StaticTransactionTimePicker({ onChange, value }: StaticTransactionTimePickerProps) {
  return (
    <StaticTimePickerFrame>
      <DatePickerLocalizationProvider dateAdapter={AdapterDayjs}>
        <StaticTimePicker
          ampm={false}
          onChange={onChange}
          orientation="portrait"
          slotProps={{
            actionBar: {
              actions: [],
            },
          }}
          value={value}
        />
      </DatePickerLocalizationProvider>
    </StaticTimePickerFrame>
  )
}
