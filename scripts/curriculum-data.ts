import { w } from './curriculum-data-helpers';

export type RawWord = {
  ru: string;
  en: string;
  stress?: string;
  s1: string;
  s1en: string;
  s2: string;
  s2en: string;
};

export type RawDay = {
  day: number;
  theme: string;
  grammarFocus: string;
  words: RawWord[];
  grammarPrompts: { prompt: string; options: string[]; correct: number }[];
  speakingPrompts: string[];
};

export const CURRICULUM: RawDay[] = [
  {
    day: 1,
    theme: 'Greetings & introductions',
    grammarFocus: 'Personal pronouns, быть present',
    words: [
      w('привет', 'hello (informal)', 'Привет, как дела?', 'Hello, how are you?', 'Он сказал привет.', 'He said hello.'),
      w('здравствуйте', 'hello (formal)', 'Здравствуйте, меня зовут Анна.', 'Hello, my name is Anna.', 'Здравствуйте, доктор.', 'Hello, doctor.'),
      w('до свидания', 'goodbye', 'До свидания, увидимся завтра.', 'Goodbye, see you tomorrow.', 'Она сказала до свидания.', 'She said goodbye.'),
      w('спасибо', 'thank you', 'Спасибо за помощь.', 'Thank you for the help.', 'Большое спасибо!', 'Thank you very much!'),
      w('пожалуйста', 'please / you\'re welcome', 'Пожалуйста, садитесь.', 'Please, sit down.', 'Спасибо! — Пожалуйста.', 'Thanks! — You\'re welcome.'),
      w('извините', 'excuse me / sorry', 'Извините, где туалет?', 'Excuse me, where is the bathroom?', 'Извините за опоздание.', 'Sorry for being late.'),
      w('меня зовут', 'my name is', 'Меня зовут Иван.', 'My name is Ivan.', 'Меня зовут Мария.', 'My name is Maria.'),
      w('как дела', 'how are you', 'Привет, как дела?', 'Hi, how are you?', 'Как дела? — Хорошо.', 'How are you? — Good.'),
      w('хорошо', 'good / well', 'У меня всё хорошо.', 'I am doing well.', 'Это хорошо.', 'That is good.'),
      w('очень приятно', 'nice to meet you', 'Очень приятно познакомиться.', 'Nice to meet you.', 'Мне тоже очень приятно.', 'Nice to meet you too.'),
    ],
    grammarPrompts: [
      { prompt: 'Я ___ студент. (I am a student)', options: ['есть', '—', 'были', 'буду'], correct: 1 },
      { prompt: 'Ты ___ дома? (Are you at home?)', options: ['есть', '—', 'был', 'будешь'], correct: 1 },
      { prompt: 'Они ___ друзья. (They are friends)', options: ['есть', '—', 'был', 'будет'], correct: 1 },
      { prompt: 'Мы ___ в Москве. (We are in Moscow)', options: ['есть', '—', 'была', 'будут'], correct: 1 },
      { prompt: 'Вы ___ учитель? (Are you a teacher?)', options: ['есть', '—', 'был', 'буду'], correct: 1 },
      { prompt: 'Она ___ врач. (She is a doctor)', options: ['есть', '—', 'были', 'будешь'], correct: 1 },
    ],
    speakingPrompts: ['Привет, меня зовут ...', 'Очень приятно познакомиться.', 'Как дела? — Хорошо, спасибо.', 'До свидания!', 'Здравствуйте, пожалуйста.'],
  },
  {
    day: 2,
    theme: 'Numbers 1–20',
    grammarFocus: 'Gender agreement basics',
    words: [
      w('один', 'one', 'У меня один брат.', 'I have one brother.', 'Один, два, три...', 'One, two, three...'),
      w('два', 'two', 'Два яблока на столе.', 'Two apples on the table.', 'Мне двадцать два года.', 'I am twenty-two years old.'),
      w('три', 'three', 'Три друга пришли.', 'Three friends came.', 'На столе три чашки.', 'There are three cups on the table.'),
      w('четыре', 'four', 'Четыре стула в комнате.', 'Four chairs in the room.', 'У неё четыре кота.', 'She has four cats.'),
      w('пять', 'five', 'Пять минут подожди.', 'Wait five minutes.', 'Пять книг на полке.', 'Five books on the shelf.'),
      w('шесть', 'six', 'Шесть дней в неделе работаю.', 'I work six days a week.', 'Ему шесть лет.', 'He is six years old.'),
      w('семь', 'seven', 'Семь дней — одна неделя.', 'Seven days — one week.', 'На улице семь машин.', 'There are seven cars outside.'),
      w('восемь', 'eight', 'Восемь утра — рано.', 'Eight in the morning is early.', 'В классе восемь учеников.', 'There are eight students in class.'),
      w('девять', 'nine', 'Девять месяцев — беременность.', 'Nine months — pregnancy.', 'Девять этажей в доме.', 'Nine floors in the building.'),
      w('десять', 'ten', 'Десять рублей стоит.', 'It costs ten rubles.', 'Мне десять лет.', 'I am ten years old.'),
    ],
    grammarPrompts: [
      { prompt: 'Один стол → два ___', options: ['стол', 'стола', 'столы', 'столом'], correct: 1 },
      { prompt: 'Одна книга → две ___', options: ['книг', 'книга', 'книги', 'книгу'], correct: 2 },
      { prompt: 'Один друг → три ___', options: ['друга', 'друг', 'друзей', 'друзья'], correct: 0 },
      { prompt: 'Одно окно → четыре ___', options: ['окна', 'окно', 'окон', 'окну'], correct: 0 },
      { prompt: 'Один день → пять ___', options: ['день', 'дня', 'дней', 'дню'], correct: 2 },
      { prompt: 'Одна рука → две ___', options: ['рук', 'рука', 'руки', 'руку'], correct: 2 },
    ],
    speakingPrompts: ['Один, два, три, четыре, пять', 'Мне двадцать лет.', 'Сколько? — Пять.', 'На столе три яблока.', 'Подожди пять минут.'],
  },
  {
    day: 3,
    theme: 'Numbers 21–100, age',
    grammarFocus: 'Nominative vs accusative (inanimate)',
    words: [
      w('двадцать', 'twenty', 'Мне двадцать лет.', 'I am twenty years old.', 'Двадцать минут езды.', 'Twenty minutes by car.'),
      w('тридцать', 'thirty', 'Тридцать дней — месяц.', 'Thirty days — a month.', 'Ему тридцать пять.', 'He is thirty-five.'),
      w('сорок', 'forty', 'Сорок человек в зале.', 'Forty people in the hall.', 'Сорок пять рублей.', 'Forty-five rubles.'),
      w('пятьдесят', 'fifty', 'Пятьдесят процентов скидка.', 'Fifty percent discount.', 'Ей пятьдесят лет.', 'She is fifty years old.'),
      w('шестьдесят', 'sixty', 'Шестьдесят минут — час.', 'Sixty minutes — an hour.', 'Дедушке шестьдесят.', 'Grandpa is sixty.'),
      w('сколько', 'how many / how much', 'Сколько тебе лет?', 'How old are you?', 'Сколько это стоит?', 'How much does it cost?'),
      w('год', 'year', 'Мне двадцать один год.', 'I am twenty-one years old.', 'Новый год скоро.', 'New Year is soon.'),
      w('лет', 'years (age)', 'Мне тридцать лет.', 'I am thirty years old.', 'Ему пять лет.', 'He is five years old.'),
      w('сто', 'one hundred', 'Сто рублей, пожалуйста.', 'One hundred rubles, please.', 'Сто процентов уверен.', 'One hundred percent sure.'),
      w('рубль', 'ruble', 'Один рубль — мало.', 'One ruble is little.', 'Сто рублей за билет.', 'One hundred rubles for the ticket.'),
    ],
    grammarPrompts: [
      { prompt: 'Я вижу ___ (стол).', options: ['стол', 'стола', 'столу', 'столом'], correct: 0 },
      { prompt: 'Я читаю ___ (книга).', options: ['книга', 'книгу', 'книги', 'книге'], correct: 1 },
      { prompt: 'Я покупаю ___ (молоко).', options: ['молоко', 'молока', 'молоку', 'молоком'], correct: 0 },
      { prompt: 'Я люблю ___ (музыка).', options: ['музыка', 'музыку', 'музыки', 'музыке'], correct: 1 },
      { prompt: 'Я открываю ___ (окно).', options: ['окно', 'окна', 'окну', 'окном'], correct: 0 },
      { prompt: 'Я пью ___ (кофе).', options: ['кофе', 'кофя', 'кофю', 'кофем'], correct: 0 },
    ],
    speakingPrompts: ['Сколько тебе лет?', 'Мне двадцать пять лет.', 'Это стоит пятьдесят рублей.', 'Сорок минут до станции.', 'Мне тридцать один год.'],
  },
];
