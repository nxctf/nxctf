export const formatSmartFlag = (input: string, mask: string): string => {
  if (!input) return ''

  let result = ''
  let i = 0 // input index

  for (let m = 0; m < mask.length; m++) {
    const maskChar = mask[m]
    const isPlaceholder = ['*', '?', 'X', 'x', '0'].includes(maskChar)

    if (!isPlaceholder) {
      // 1. Handle Literal character first
      result += maskChar
      // If user actually typed this literal at the current position, consume it
      if (input[i] === maskChar) {
        i++
      }
    } else {
      // 2. Handle Placeholder: find exactly one valid char for this spot
      let found = false
      while (i < input.length) {
        let char = input[i++]
        let accepted = false

        if (maskChar === '*' || maskChar === '?') {
          accepted = true
        } else if (maskChar === '0') {
          accepted = /[0-9]/.test(char)
        } else if (maskChar === 'X' || maskChar === 'x') {
          // X and x are for letters only
          accepted = /[a-zA-Z]/.test(char)
          if (accepted) {
            char = maskChar === 'X' ? char.toUpperCase() : char.toLowerCase()
          }
        }

        if (accepted) {
          result += char
          found = true
          break
        }

        // If we hit a character that matches the NEXT literal, stop skipping!
        // This prevents the "walking" bug where it skips useful format chars.
        if (m + 1 < mask.length && char === mask[m + 1] && !['*', '?', 'X', 'x', '0'].includes(mask[m + 1])) {
           i-- // Put it back so the next iteration can catch it as a literal
           break
        }
      }

      if (!found) break
    }
  }

  return result
}
