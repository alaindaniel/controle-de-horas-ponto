const CalculoPonto = require('../js/engine.js');
const assert = require('assert');

console.log('=== TESTANDO ENGINE DE CÁLCULO DE PONTO ===\n');

// 1. Teste Carga 6x1 (07:20) jornada normal
let r1 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '08:00',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '16:20'
}, '6x1');
console.log('Teste 1 (Jornada Exata 07:20):', r1);
assert.strictEqual(r1.totalTrabalhado, '07:20');
assert.strictEqual(r1.diferenca, ''); // zero diferença
assert.strictEqual(r1.hs50, '');
assert.strictEqual(r1.hs100, '');

// 2. Teste Tolerância 10 min (diferença +10m -> sem hora extra)
let r2 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '08:00',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '16:30'
}, '6x1');
console.log('Teste 2 (Tolerância +10 min):', r2);
assert.strictEqual(r2.totalTrabalhado, '07:30');
assert.strictEqual(r2.diferenca, '00:10');
assert.strictEqual(r2.hs50, ''); // tolerância

// 3. Teste Hora Extra > 10 min até 2h (+40 min -> Hs. 50% = 00:40)
let r3 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '08:00',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '17:00'
}, '6x1');
console.log('Teste 3 (Extra 40m a 50%):', r3);
assert.strictEqual(r3.totalTrabalhado, '08:00');
assert.strictEqual(r3.diferenca, '00:40');
assert.strictEqual(r3.hs50, '00:40');
assert.strictEqual(r3.hs100, '');

// 4. Teste Hora Extra > 2 horas (+3h10 -> 2h a 50%, 1h10 a 100%)
let r4 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '08:00',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '19:30'
}, '6x1');
console.log('Teste 4 (Extra 3h10 -> 2h 50% + 1h10 100%):', r4);
assert.strictEqual(r4.totalTrabalhado, '10:30');
assert.strictEqual(r4.diferenca, '03:10');
assert.strictEqual(r4.hs50, '02:00');
assert.strictEqual(r4.hs100, '01:10');

// 5. Teste Dobra (Evento "dobra" -> 100% integral)
let r5 = CalculoPonto.calcularDia({
  evento: 'dobra',
  entrada: '08:00',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '16:20'
}, '6x1');
console.log('Teste 5 (Evento Dobra 100% integral):', r5);
assert.strictEqual(r5.totalTrabalhado, '07:20');
assert.strictEqual(r5.hs100, '07:20');

// 6. Teste Falta (Evento "falta" -> débito -07:20)
let r6 = CalculoPonto.calcularDia({
  evento: 'falta',
  entrada: '',
  intervaloSaida: '',
  intervaloRetorno: '',
  saida: ''
}, '6x1');
console.log('Teste 6 (Falta - débito):', r6);
assert.strictEqual(r6.faltas, '-07:20');

// 7. Teste Atraso com Tolerância <= 10 min (atraso 10m -> sem desconto)
let r7 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '08:10',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '16:20'
}, '6x1');
console.log('Teste 7 (Atraso tolerado 10m):', r7);
assert.strictEqual(r7.totalTrabalhado, '07:10');
assert.strictEqual(r7.diferenca, '-00:10');
assert.strictEqual(r7.faltas, ''); // tolerado!

// 8. Teste Atraso > 10 min (atraso 30m -> desconto -00:30)
let r8 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '08:30',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '16:20'
}, '6x1');
console.log('Teste 8 (Atraso descontado 30m):', r8);
assert.strictEqual(r8.totalTrabalhado, '06:50');
assert.strictEqual(r8.diferenca, '-00:30');
assert.strictEqual(r8.faltas, '-00:30');

// 9. Teste Adicional Noturno (trabalho das 18:00 às 00:00 -> 2h noturnas)
let r9 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '18:00',
  intervaloSaida: '20:00',
  intervaloRetorno: '21:00',
  saida: '00:00'
}, '6x1');
console.log('Teste 9 (Adicional Noturno 22h às 00h):', r9);
assert.strictEqual(r9.adNoturno, '02:00');

// 10. Teste Escala 12x36 (07:00 às 19:00 com 1h intervalo -> 11h + 1h almoço = 12:00)
let r10 = CalculoPonto.calcularDia({
  evento: 'normal',
  entrada: '07:00',
  intervaloSaida: '12:00',
  intervaloRetorno: '13:00',
  saida: '19:00'
}, '12x36');
console.log('Teste 10 (Escala 12x36 +1h almoço):', r10);
assert.strictEqual(r10.totalTrabalhado, '12:00');
assert.strictEqual(r10.diferenca, '');

// 11. Teste Seletor de Intervalo folhaPonto
let p1 = CalculoPonto.parseIntervalo('5-10');
assert.strictEqual(p1.valid, true);
assert.strictEqual(p1.list.length, 6);
assert.deepStrictEqual(p1.list, [5, 6, 7, 8, 9, 10]);

let p2 = CalculoPonto.parseIntervalo('15');
assert.strictEqual(p2.valid, true);
assert.deepStrictEqual(p2.list, [15]);

let p3 = CalculoPonto.parseIntervalo('30-10');
assert.strictEqual(p3.valid, false);

console.log('\n>>> TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! <<<\n');
