import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { IconButton, Tooltip } from '@mui/material'
import { useLocalization } from '../../app/LocalizationContext'
import type { TextDirection } from '../../app/localization'
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
  const { direction } = useLocalization()
  const side = getNavigationSide(action, direction)
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          aria-label={title}
          disabled={disabled}
          onClick={onClick}
          sx={placement === 'side' ? getSideButtonStyles(side) : undefined}
        >
          <Icon />
        </IconButton>
      </span>
    </Tooltip>
  )
}

function getNavigationSide(action: TransactionNavigationAction, direction: TextDirection) {
  if (action === 'previous') {
    return direction === 'rtl' ? 'right' : 'left'
  }

  return direction === 'rtl' ? 'left' : 'right'
}

function getSideButtonStyles(side: 'left' | 'right') {
  return {
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'divider',
    boxShadow: 2,
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    ...(side === 'left' ? { left: -22 } : { right: -22 }),
    '&:hover': {
      bgcolor: 'background.paper',
    },
  }
}
