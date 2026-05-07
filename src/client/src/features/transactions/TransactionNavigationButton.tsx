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
      <IconButton
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
        sx={getButtonStyles(action, placement)}
      >
        {pointsLeft ? (
          <ChevronLeftIcon className="icon-arrow" />
        ) : (
          <ChevronRightIcon className="icon-arrow" />
        )}
      </IconButton>
    </Tooltip>
  )
}

function getButtonStyles(action: TransactionNavigationAction, placement: 'inline' | 'side') {
  return {
    '& .icon-arrow': {
      transformOrigin: 'center',
    },
    '[dir="rtl"] & .icon-arrow': {
      transform: 'scaleX(-1)',
    },
    ...(placement === 'side' ? getSideButtonStyles(action) : {}),
  }
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
