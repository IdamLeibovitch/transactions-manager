export type Language = 'en' | 'he'
export type TextDirection = 'ltr' | 'rtl'

export type LocalizationContextValue = {
  direction: TextDirection
  language: Language
  locale: string
  t: (key: TranslationKey) => string
}

export const translations = {
  en: {
    'app.title': 'Transaction Approval Simulator',
    'auth.account': 'Account',
    'auth.cancel': 'Cancel',
    'auth.invalidCredentials': 'Invalid username or password.',
    'auth.login': 'Login',
    'auth.loginFailed': 'Login failed.',
    'auth.logout': 'Logout',
    'auth.password': 'Password',
    'auth.screenSubtitle': 'Use the development credentials to continue.',
    'auth.screenTitle': 'Sign in',
    'auth.username': 'Username',
    'cards.approvedCount': '{count} approved',
    'cards.approvedTransactions': 'Approved transactions',
    'cards.emptyBody': 'Approved submissions will appear here after the processor finishes.',
    'cards.emptyTitle': 'No approved transactions yet',
    'cards.loading': 'Loading approved transactions',
    'cards.pendingTime': 'Pending time',
    'cards.realtime.connected': 'Realtime connected',
    'cards.realtime.connecting': 'Realtime connecting',
    'cards.realtime.disconnected': 'Realtime disconnected',
    'cards.refresh': 'Refresh',
    'common.approved': 'Approved',
    'common.language': 'Language',
    'common.unexpectedError': 'Unexpected error',
    'dashboard.authRequired': 'Login with the development credentials to submit and view transactions.',
    'dashboard.bankingHours.body': 'Approved from 08:00 through 17:59 local time.',
    'dashboard.bankingHours.title': 'Banking hours',
    'dashboard.localTime.body': 'The backend stores every submission and only approved transactions appear below.',
    'dashboard.localTime.title': 'Selected region decides the local time',
    'dashboard.subtitle': 'Submitted instants are evaluated against local banking hours in the selected region.',
    'dashboard.title': 'Submit transaction',
    'decision.outsideBankingHours': 'Outside banking hours',
    'decision.unsupportedRegion': 'Unsupported region',
    'decision.withinBankingHours': 'Within banking hours',
    'form.amount': 'Amount',
    'form.currency': 'Currency',
    'form.fixErrors': 'Fix the highlighted fields before submitting.',
    'form.merchantName': 'Merchant name',
    'form.region': 'Region',
    'form.submit': 'Submit transaction',
    'form.submittedInstant': 'Submitted instant',
    'form.utcHelper': 'UTC instant used for approval',
    'message.loginBeforeSubmit': 'Login before submitting transactions.',
    'message.transactionApproved': 'Transaction approved.',
    'message.transactionRejected': 'Transaction rejected: {reason}.',
    'message.transactionSubmitted': 'Transaction {id} submitted. Waiting for status update.',
    'region.EU_CENTRAL': 'EU Central',
    'region.IL': 'Israel',
    'region.UK': 'United Kingdom',
    'region.US_EAST': 'US East',
    'validation.amount': 'Amount must be greater than zero.',
    'validation.currency': 'Use a three-letter currency code.',
    'validation.merchantName': 'Merchant name is required and cannot exceed 120 characters.',
    'validation.submittedAt': 'Choose a valid submitted instant.',
  },
  he: {
    'app.title': 'סימולטור אישור עסקאות',
    'auth.account': 'חשבון',
    'auth.cancel': 'ביטול',
    'auth.invalidCredentials': 'שם המשתמש או הסיסמה אינם תקינים.',
    'auth.login': 'כניסה',
    'auth.loginFailed': 'הכניסה נכשלה.',
    'auth.logout': 'יציאה',
    'auth.password': 'סיסמה',
    'auth.screenSubtitle': 'יש להשתמש בפרטי הפיתוח כדי להמשיך.',
    'auth.screenTitle': 'כניסה למערכת',
    'auth.username': 'שם משתמש',
    'cards.approvedCount': '{count} אושרו',
    'cards.approvedTransactions': 'עסקאות מאושרות',
    'cards.emptyBody': 'עסקאות מאושרות יופיעו כאן לאחר שהמעבד יסיים.',
    'cards.emptyTitle': 'אין עדיין עסקאות מאושרות',
    'cards.loading': 'טוען עסקאות מאושרות',
    'cards.pendingTime': 'זמן בהמתנה',
    'cards.realtime.connected': 'עדכונים בזמן אמת מחוברים',
    'cards.realtime.connecting': 'מתחבר לעדכונים בזמן אמת',
    'cards.realtime.disconnected': 'עדכונים בזמן אמת מנותקים',
    'cards.refresh': 'רענון',
    'common.approved': 'מאושרת',
    'common.language': 'שפה',
    'common.unexpectedError': 'שגיאה לא צפויה',
    'dashboard.authRequired': 'יש להתחבר עם פרטי הפיתוח כדי לשלוח ולצפות בעסקאות.',
    'dashboard.bankingHours.body': 'עסקאות מאושרות מ-08:00 עד 17:59 בזמן המקומי.',
    'dashboard.bankingHours.title': 'שעות בנקאות',
    'dashboard.localTime.body': 'השרת שומר כל שליחה, ורק עסקאות מאושרות מופיעות למטה.',
    'dashboard.localTime.title': 'האזור שנבחר קובע את הזמן המקומי',
    'dashboard.subtitle': 'זמן השליחה נבדק מול שעות הבנקאות המקומיות באזור שנבחר.',
    'dashboard.title': 'שליחת עסקה',
    'decision.outsideBankingHours': 'מחוץ לשעות הבנקאות',
    'decision.unsupportedRegion': 'אזור לא נתמך',
    'decision.withinBankingHours': 'בתוך שעות הבנקאות',
    'form.amount': 'סכום',
    'form.currency': 'מטבע',
    'form.fixErrors': 'יש לתקן את השדות המסומנים לפני השליחה.',
    'form.merchantName': 'שם בית עסק',
    'form.region': 'אזור',
    'form.submit': 'שליחת עסקה',
    'form.submittedInstant': 'זמן שליחה',
    'form.utcHelper': 'זמן UTC המשמש להחלטת האישור',
    'message.loginBeforeSubmit': 'יש להתחבר לפני שליחת עסקאות.',
    'message.transactionApproved': 'העסקה אושרה.',
    'message.transactionRejected': 'העסקה נדחתה: {reason}.',
    'message.transactionSubmitted': 'העסקה {id} נשלחה. ממתין לעדכון סטטוס.',
    'region.EU_CENTRAL': 'מרכז אירופה',
    'region.IL': 'ישראל',
    'region.UK': 'בריטניה',
    'region.US_EAST': 'מזרח ארה״ב',
    'validation.amount': 'הסכום חייב להיות גדול מאפס.',
    'validation.currency': 'יש להזין קוד מטבע בן שלוש אותיות.',
    'validation.merchantName': 'שם בית העסק הוא חובה ואינו יכול לחרוג מ-120 תווים.',
    'validation.submittedAt': 'יש לבחור זמן שליחה תקין.',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export const languageLocale: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
}

export function getTextDirection(language: Language): TextDirection {
  return language === 'he' ? 'rtl' : 'ltr'
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  )
}
