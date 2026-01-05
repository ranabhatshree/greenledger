/**
 * Converts a number to words in Indian currency format
 * Example: 482.40 -> "Four hundred eighty-two rupees and forty paisa only"
 */
export function numberToWords(num: number): string {
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  const convertHundreds = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' hundred';
      n %= 100;
      if (n > 0) result += ' ';
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) result += '-' + ones[n];
    } else if (n > 0) {
      result += ones[n];
    }
    return result;
  };

  const convertThousands = (n: number): string => {
    if (n < 1000) return convertHundreds(n);
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    let result = convertHundreds(thousands) + ' thousand';
    if (remainder > 0) {
      result += ' ' + convertHundreds(remainder);
    }
    return result;
  };

  const convertLakhs = (n: number): string => {
    if (n < 100000) return convertThousands(n);
    const lakhs = Math.floor(n / 100000);
    const remainder = n % 100000;
    let result = convertHundreds(lakhs) + ' lakh';
    if (remainder > 0) {
      result += ' ' + convertThousands(remainder);
    }
    return result;
  };

  const convertCrores = (n: number): string => {
    if (n < 10000000) return convertLakhs(n);
    const crores = Math.floor(n / 10000000);
    const remainder = n % 10000000;
    let result = convertHundreds(crores) + ' crore';
    if (remainder > 0) {
      result += ' ' + convertLakhs(remainder);
    }
    return result;
  };

  // Split into rupees and paisa
  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);

  let result = '';

  if (rupees > 0) {
    result = convertCrores(rupees);
    result += rupees === 1 ? ' rupee' : ' rupees';
  }

  if (paisa > 0) {
    if (rupees > 0) {
      result += ' and ';
    }
    const paisaWords = convertHundreds(paisa);
    result += paisaWords;
    result += paisa === 1 ? ' paisa' : ' paisa';
  }

  if (result === '') {
    result = 'zero rupees';
  }

  return result.charAt(0).toUpperCase() + result.slice(1) + ' only';
}

