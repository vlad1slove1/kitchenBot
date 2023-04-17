import { Markup } from 'telegraf';

/**
 * Создание готовой клавиатуры для быстрого ввода комманд
 *
 * @returns {Array} Возвращает массив кнопок в клавиатуре
 */
const getMainMenu = () => Markup.keyboard([
  ['Участвовать  🙋🏼‍♂️'],
  ['Список участников  👩‍💼👨‍💼🧑🏻‍💼', 'Общее количество  🧮'],
  ['Не пойду  🚫'],
]).resize();

export default getMainMenu;
