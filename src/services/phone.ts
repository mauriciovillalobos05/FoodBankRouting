import { parsePhoneNumberFromString } from 'libphonenumber-js/min'
import type { CountryCode } from 'libphonenumber-js' 

export function toE164(
  input: string,
  defaultCountry?: CountryCode
): string | null {
  
  const p = defaultCountry
    ? parsePhoneNumberFromString(input, { defaultCountry })
    : parsePhoneNumberFromString(input)

  if (!p || !p.isValid()) return null
  return p.number 
}
