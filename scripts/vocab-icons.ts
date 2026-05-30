/** Simple line-art SVG icons for vocabulary illustration (viewBox 0 0 100 100). */

export type IconCategory =
  | 'greet'
  | 'goodbye'
  | 'thanks'
  | 'please'
  | 'sorry'
  | 'name'
  | 'good'
  | 'number'
  | 'food'
  | 'drink'
  | 'family'
  | 'home'
  | 'place'
  | 'travel'
  | 'weather'
  | 'time'
  | 'body'
  | 'color'
  | 'animal'
  | 'work'
  | 'school'
  | 'money'
  | 'shop'
  | 'health'
  | 'emotion'
  | 'clothing'
  | 'nature'
  | 'transport'
  | 'question'
  | 'language'
  | 'default';

const KEYWORD_RULES: { category: IconCategory; keywords: string[] }[] = [
  { category: 'greet', keywords: ['hello', 'hi ', 'good morning', 'good evening', 'nice to meet'] },
  { category: 'goodbye', keywords: ['goodbye', 'bye', 'see you', 'farewell'] },
  { category: 'thanks', keywords: ['thank', 'thanks'] },
  { category: 'please', keywords: ['please', "you're welcome", 'welcome'] },
  { category: 'sorry', keywords: ['sorry', 'excuse'] },
  { category: 'name', keywords: ['name is', 'my name', 'called'] },
  { category: 'good', keywords: ['good', 'well', 'fine', 'great', 'nice', 'beautiful', 'happy'] },
  { category: 'number', keywords: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty', 'thirty', 'forty', 'fifty', 'hundred', 'number', 'first', 'second', 'third'] },
  { category: 'food', keywords: ['food', 'eat', 'bread', 'meat', 'fish', 'soup', 'salad', 'fruit', 'apple', 'cheese', 'egg', 'rice', 'cake', 'breakfast', 'lunch', 'dinner', 'restaurant', 'menu', 'hungry', 'cook', 'kitchen', 'sugar', 'salt', 'pepper', 'potato', 'tomato', 'onion', 'carrot', 'banana', 'orange', 'lemon', 'berry', 'nut', 'butter', 'milk product'] },
  { category: 'drink', keywords: ['drink', 'water', 'tea', 'coffee', 'juice', 'wine', 'beer', 'milk', 'bottle', 'cup', 'glass'] },
  { category: 'family', keywords: ['mother', 'father', 'parent', 'son', 'daughter', 'brother', 'sister', 'family', 'child', 'baby', 'husband', 'wife', 'grand', 'uncle', 'aunt', 'friend'] },
  { category: 'home', keywords: ['home', 'house', 'room', 'door', 'window', 'bed', 'table', 'chair', 'sofa', 'kitchen', 'bathroom', 'floor', 'wall', 'key', 'apartment', 'live', 'address'] },
  { category: 'place', keywords: ['city', 'street', 'park', 'shop', 'store', 'market', 'bank', 'hotel', 'station', 'airport', 'hospital', 'school building', 'library', 'museum', 'church', 'office', 'building', 'place', 'square', 'bridge'] },
  { category: 'travel', keywords: ['travel', 'trip', 'passport', 'ticket', 'map', 'luggage', 'tourist', 'visit', 'abroad', 'direction'] },
  { category: 'weather', keywords: ['weather', 'rain', 'snow', 'sun', 'cloud', 'wind', 'cold', 'hot', 'warm', 'season', 'spring', 'summer', 'winter', 'autumn', 'fall', 'storm', 'sky'] },
  { category: 'time', keywords: ['time', 'hour', 'minute', 'day', 'week', 'month', 'year', 'today', 'tomorrow', 'yesterday', 'morning', 'evening', 'night', 'clock', 'calendar', 'early', 'late', 'now', 'always', 'never', 'sometimes'] },
  { category: 'body', keywords: ['head', 'hand', 'eye', 'ear', 'nose', 'mouth', 'face', 'hair', 'leg', 'foot', 'arm', 'finger', 'heart', 'body', 'back', 'stomach', 'tooth', 'health body'] },
  { category: 'color', keywords: ['color', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'grey', 'gray', 'pink', 'orange', 'purple'] },
  { category: 'animal', keywords: ['dog', 'cat', 'bird', 'horse', 'cow', 'animal', 'pet', 'fish animal', 'bear', 'wolf', 'chicken', 'mouse'] },
  { category: 'work', keywords: ['work', 'job', 'office', 'boss', 'employee', 'meeting', 'business', 'company', 'profession', 'doctor', 'teacher', 'engineer', 'lawyer', 'driver'] },
  { category: 'school', keywords: ['school', 'student', 'teacher', 'class', 'lesson', 'study', 'book', 'read', 'write', 'learn', 'university', 'exam', 'homework', 'pen', 'paper', 'dictionary'] },
  { category: 'money', keywords: ['money', 'ruble', 'dollar', 'euro', 'price', 'cost', 'pay', 'buy', 'sell', 'cheap', 'expensive', 'wallet', 'card payment'] },
  { category: 'shop', keywords: ['shop', 'buy', 'store', 'market', 'product', 'customer', 'sale', 'order'] },
  { category: 'health', keywords: ['health', 'doctor', 'medicine', 'pharmacy', 'pain', 'sick', 'ill', 'hospital', 'nurse', 'appointment'] },
  { category: 'emotion', keywords: ['love', 'like', 'hate', 'afraid', 'sad', 'angry', 'tired', 'bored', 'excited', 'feel', 'emotion', 'smile', 'cry', 'worry'] },
  { category: 'clothing', keywords: ['clothes', 'shirt', 'dress', 'pants', 'shoe', 'hat', 'coat', 'jacket', 'wear', 'sock', 'skirt', 'suit'] },
  { category: 'nature', keywords: ['tree', 'flower', 'forest', 'river', 'lake', 'sea', 'ocean', 'mountain', 'field', 'garden', 'plant', 'leaf', 'grass', 'star', 'moon', 'earth', 'fire', 'water nature'] },
  { category: 'transport', keywords: ['car', 'bus', 'train', 'metro', 'taxi', 'plane', 'bike', 'bicycle', 'ship', 'boat', 'traffic', 'road', 'drive', 'walk', 'run', 'fly'] },
  { category: 'question', keywords: ['where', 'when', 'what', 'who', 'why', 'how', 'which', 'question', 'answer'] },
  { category: 'language', keywords: ['speak', 'say', 'tell', 'word', 'language', 'russian', 'english', 'translate', 'mean', 'understand', 'listen', 'hear'] },
];

export function iconCategoryForWord(en: string): IconCategory {
  const text = en.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.category;
  }
  return 'default';
}

const ICON_PATHS: Record<IconCategory, string> = {
  greet:
    '<path d="M28 58c0-10 8-18 18-18 4 0 8 1 11 4" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M54 44c3-3 7-4 11-4 10 0 18 8 18 18" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M50 52v28M42 68h16" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  goodbye:
    '<path d="M72 38L58 52l14 14M58 52H38c-8 0-14 6-14 14v8" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  thanks:
    '<path d="M50 78V42M50 42c-8 0-14-6-14-14M50 42c8 0 14-6 14-14" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M34 58c-6 4-10 10-10 16 0 8 7 14 16 14h40c9 0 16-6 16-14 0-6-4-12-10-16" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  please:
    '<path d="M50 24v54M50 24c-6 0-10-4-10-10s4-10 10-10 10 4 10 10-4 10-10 10" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M38 68h24" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  sorry:
    '<circle cx="50" cy="50" r="28" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M36 40c2-4 6-6 10-6 6 0 10 4 10 10 0 8-10 8-10 8v6" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="42" cy="68" r="2" fill="#5d00ff"/>',
  name:
    '<circle cx="50" cy="34" r="12" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M28 78c0-12 10-22 22-22s22 10 22 22" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  good:
    '<path d="M28 56l14 14 30-34" fill="none" stroke="#5d00ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="50" r="30" fill="none" stroke="#5d00ff" stroke-width="3"/>',
  number:
    '<rect x="30" y="24" width="40" height="52" rx="4" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M42 44h16M42 56h16M42 68h10" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  food:
    '<ellipse cx="50" cy="58" rx="26" ry="14" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M24 58c0-14 12-26 26-26s26 12 26 26" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M50 32v8" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  drink:
    '<path d="M36 28h28l-4 44c0 6-5 10-10 10s-10-4-10-10L36 28z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M34 28h32" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  family:
    '<circle cx="38" cy="36" r="8" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<circle cx="62" cy="36" r="8" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<circle cx="50" cy="58" r="7" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<path d="M28 78c2-10 10-16 20-16M72 78c-2-10-10-16-20-16" fill="none" stroke="#5d00ff" stroke-width="2.5" stroke-linecap="round"/>',
  home:
    '<path d="M50 22L22 46v32h56V46L50 22z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<rect x="42" y="56" width="16" height="22" fill="none" stroke="#5d00ff" stroke-width="3"/>',
  place:
    '<path d="M50 22c-12 0-22 10-22 22 0 16 22 36 22 36s22-20 22-36c0-12-10-22-22-22z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="50" cy="44" r="8" fill="none" stroke="#5d00ff" stroke-width="3"/>',
  travel:
    '<rect x="26" y="40" width="48" height="28" rx="4" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M26 48h48M34 40V32h32v8" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="38" cy="72" r="4" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<circle cx="62" cy="72" r="4" fill="none" stroke="#5d00ff" stroke-width="2.5"/>',
  weather:
    '<circle cx="42" cy="42" r="14" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M30 62c0-8 6-14 14-14h16c10 0 18 8 18 18H30z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>',
  time:
    '<circle cx="50" cy="50" r="28" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M50 50V34M50 50h14" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  body:
    '<circle cx="50" cy="30" r="10" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M50 40v28M36 52h28M50 68l-12 16M50 68l12 16" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  color:
    '<circle cx="38" cy="44" r="10" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<circle cx="58" cy="44" r="10" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<circle cx="48" cy="62" r="10" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<path d="M50 24v6" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  animal:
    '<circle cx="38" cy="40" r="6" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<circle cx="62" cy="40" r="6" fill="none" stroke="#5d00ff" stroke-width="2.5"/>' +
    '<ellipse cx="50" cy="56" rx="22" ry="18" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M32 48l-8-8M68 48l8-8" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  work:
    '<rect x="28" y="34" width="44" height="34" rx="2" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M28 42h44M40 34V28h20v6" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>',
  school:
    '<path d="M50 24L20 40l30 16 30-16-30-16z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M32 48v20c0 4 8 8 18 8s18-4 18-8V48" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M68 42v26" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  money:
    '<rect x="26" y="34" width="48" height="32" rx="4" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<circle cx="50" cy="50" r="10" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M50 46v8M47 50h6" fill="none" stroke="#5d00ff" stroke-width="2" stroke-linecap="round"/>',
  shop:
    '<path d="M24 38h52l-6 36H30L24 38z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M32 38c0-6 4-10 10-10s10 4 10 10M48 38c0-6 4-10 10-10s10 4 10 10" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  health:
    '<rect x="38" y="28" width="24" height="44" rx="4" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M50 40v20M42 50h16" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  emotion:
    '<circle cx="50" cy="50" r="28" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<circle cx="40" cy="44" r="3" fill="#5d00ff"/>' +
    '<circle cx="60" cy="44" r="3" fill="#5d00ff"/>' +
    '<path d="M38 58c4 6 10 8 12 8s8-2 12-8" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  clothing:
    '<path d="M50 28l-16 12v38h32V40L50 28z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M38 40h24" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  nature:
    '<path d="M50 78V48M50 48c-12 0-20-8-20-18M50 48c12 0 20-8 20-18" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M34 78h32" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
  transport:
    '<path d="M24 52h52l-6-16H30l-6 16z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="36" cy="58" r="6" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<circle cx="64" cy="58" r="6" fill="none" stroke="#5d00ff" stroke-width="3"/>',
  question:
    '<path d="M38 38c0-8 6-14 14-14 8 0 14 5 14 12 0 8-8 10-14 16v4" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="52" cy="72" r="3" fill="#5d00ff"/>',
  language:
    '<ellipse cx="50" cy="50" rx="30" ry="22" fill="none" stroke="#5d00ff" stroke-width="3"/>' +
    '<path d="M20 50h60M50 28c8 6 12 14 12 22s-4 16-12 22M50 28c-8 6-12 14-12 22s4 16 12 22" fill="none" stroke="#5d00ff" stroke-width="2.5"/>',
  default:
    '<path d="M30 24h40v52H30z" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M38 36h24M38 48h24M38 60h16" fill="none" stroke="#5d00ff" stroke-width="3" stroke-linecap="round"/>',
};

export function buildVocabSvg(en: string, ru: string): string {
  const category = iconCategoryForWord(en);
  const icon = ICON_PATHS[category];
  const safeRu = ru.replace(/[<>&"']/g, '');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${safeRu}">` +
    '<rect width="320" height="320" fill="#5d00ff"/>' +
    '<rect x="12" y="12" width="296" height="296" fill="#faf8ff"/>' +
    '<rect x="20" y="20" width="280" height="280" fill="none" stroke="#5d00ff" stroke-width="1" opacity="0.25"/>' +
    `<g transform="translate(60 44) scale(2)">${icon}</g>` +
    '</svg>'
  );
}
