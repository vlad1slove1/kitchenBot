import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import _ from 'lodash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFixturePath = (filename) => resolve(__dirname, '..', '__fixtures__', filename);
const readFile = (filename) => readFileSync(getFixturePath(filename), 'utf-8');

/**
 * Вспомогательная функция, которая делит коллекцию на части
 *
 * @param {Array} db Исходный массив объектов
 * @param {Number} chunk Делитель массива
 * @returns {Array} Возвращает новый массив объектов
 */
export const chunkArray = (db, chunk) => {
  const newArray = [];

  for (let i = 0; i < db.length; i += chunk) {
    newArray.push(db.slice(i, i + chunk));
  }

  return newArray;
};

/**
 * Вспомогательная функция-предикат. Определяет, есть ли пользователь в массиве через 'id'
 *
 * @param {Array} db Исходный массив объектов
 * @param {Object} from Пользователь в виде объекта
 * @returns {Boolean} Возвращает 'true' или 'false'
 */
export const isParticipant = (db, from) => db.some((person) => person.id === from.id);

/**
 * Вспомогательная функция для чтения коллекции пользователей и для записи в неё новых пользователей
 * Перед записью идёт проверка на существование пользователя в коллекции по его 'id'
 * Итоговая коллекция уникальных пользователей в формате JSON
 *
 * @param {Object} ctx Объект контекста Telegraf API
 */
export const pushUserToColl = (ctx) => {
  const { from } = ctx.message;
  const rawFile = readFile('usersColl.json');
  const parsedColl = JSON.parse(rawFile);

  const uniqParsedColl = _.uniqBy(parsedColl, 'id');

  // Доп. функция-предикат для проверки существования объекта в массиве
  const hasCollUser = uniqParsedColl.some((item) => {
    if (item.id === from.id) return true;

    return false;
  });

  if (!hasCollUser) {
    uniqParsedColl.push(from);
    const stringifiedData = JSON.stringify(uniqParsedColl);

    writeFileSync(getFixturePath('usersColl.json'), stringifiedData, (err) => {
      if (err) throw err;
      console.log('Файл был сохранен!');
    });
  }
};

/**
 * Вспомогательная функция для отправки сообщения
 * сообщение получат все пользователи из файла 'usersColl.json' по своему 'chatID'
 *
 * @param {Object} bot Объект Telegraf api
 * @param {String} message Сообщение в виде строки
 */
export const sendMessage = (bot, message) => {
  const rawFile = readFile('usersColl.json');
  const parsedColl = JSON.parse(rawFile);

  parsedColl.forEach((user) => {
    bot.telegram.sendMessage(user.id, message);
  });
};
