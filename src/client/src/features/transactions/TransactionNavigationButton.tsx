import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { IconButton, Tooltip } from '@mui/material'
import type { TransactionNavigationAction } from './utils/transactionListNavigation'

type TransactionNavigationButtonProps = {
  action: TransactionNavigationAction
  disabled: boolean
  onClick: () => void
  placement?: 'inline' | 'side'
  title: string
}

export function TransactionNavigationButton({
  action,
  disabled,
  onClick,
  placement = 'inline',
  title,
}: TransactionNavigationButtonProps) {
  const pointsLeft = action === 'previous'

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          aria-label={title}
          disabled={disabled}
          onClick={onClick}
          sx={placement === 'side' ? getSideButtonStyles(action) : undefined}
        >
          {pointsLeft ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </span>
    </Tooltip>
  )
}

function getSideButtonStyles(action: TransactionNavigationAction) {
  return {
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'divider',
    boxShadow: 2,
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    ...(action === 'previous' ? { insetInlineStart: 8 } : { insetInlineEnd: 8 }),
    '&:hover': {
      bgcolor: 'background.paper',
    },
  }
}
