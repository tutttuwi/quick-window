// import en from '../../public/_locales/en/messages.json';
import ja from '../../public/_locales/ja/messages.json';

const messages = { ja };
type Language = keyof typeof messages;
type MessageKey = keyof typeof ja;

export const getMessage = (key: MessageKey) => {
  const lang = navigator.language.slice(0, 2) as Language;
  return messages[Object.keys(messages).includes(lang) ? lang : 'ja'][key].message;
};
