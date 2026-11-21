import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateRecommendedPrices,
  validateCustomPrices,
  calculateHaversineDistance,
  calculateDeliveryFee,
  calculateGroupSplitPayment,
} from '../src/utils/pricing.ts';
import { parseVoiceTranscript } from '../src/utils/voiceParser.ts';

describe('White Box Testing: Internal Logic, Calculations & Algorithms', () => {

  describe('1. Dynamic Pricing & Middleman Uplift Formula', () => {
    it('should calculate fair middleman-elimination benchmarks where wholesale < bulk < direct < retail', () => {
      const wholesale = 12; // Middleman price
      const retail = 28;    // Supermarket retail price
      const prices = calculateRecommendedPrices(wholesale, retail);

      assert.ok(prices.suggestedDirectPrice > wholesale, 'Direct price must be higher than wholesale');
      assert.ok(prices.suggestedDirectPrice < retail, 'Direct price must be lower than retail');
      assert.ok(prices.suggestedGroupPrice < prices.suggestedDirectPrice, 'Bulk price must offer a discount over normal price');
      assert.ok(prices.suggestedGroupPrice >= wholesale, 'Bulk price must still equal or beat wholesale');
      assert.strictEqual(prices.isValidOrder, true);
    });

    it('should validate and reject custom pricing when farmer violates middle-ground bounds', () => {
      // wholesale, bulk, direct, retail
      // Invalid: Direct price higher than supermarket retail
      const resHigh = validateCustomPrices(15, 20, 45, 30);
      assert.strictEqual(resHigh.valid, false);

      // Invalid: Bulk price lower than wholesale cost
      const resLowBulk = validateCustomPrices(15, 10, 20, 30);
      assert.strictEqual(resLowBulk.valid, false);

      // Invalid: Bulk price higher than normal price
      const resInverted = validateCustomPrices(15, 25, 20, 30);
      assert.strictEqual(resInverted.valid, false);

      // Valid: wholesale < bulk < direct < retail
      const resValid = validateCustomPrices(15, 20, 24, 32);
      assert.strictEqual(resValid.valid, true);
    });

    it('should handle zero, inverted, and negative rates gracefully without throwing NaN', () => {
      const prices = calculateRecommendedPrices(0, 0);
      assert.ok(!isNaN(prices.suggestedDirectPrice), 'Must not produce NaN');
      assert.ok(!isNaN(prices.suggestedGroupPrice), 'Must not produce NaN');
      assert.strictEqual(prices.isValidOrder, false);
    });
  });

  describe('2. Geospatial Haversine & Delivery Fee Logic', () => {
    it('should calculate accurate road distance between Hubballi farm and Vidyanagar consumer', () => {
      // Hubballi Rural: 15.3647, 75.1240 -> Vidyanagar: 15.3715, 75.1235
      const dist = calculateHaversineDistance(15.3647, 75.1240, 15.3715, 75.1235);
      assert.ok(dist >= 0.5 && dist <= 2.0, `Expected distance ~0.8 km, got ${dist} km`);
    });

    it('should compute exact delivery fee based on base rate + distance + weight surcharge', () => {
      // fulfillmentType='HOME_DELIVERY', 10 km, 20 kg, baseFee=25, rateKm=2.5, rateKg=0.5
      // 25 + (10 * 2.5) + (20 * 0.5) = 25 + 25 + 10 = 60
      const fee = calculateDeliveryFee('HOME_DELIVERY', 10, 20, 25, 2.5, 0.5);
      assert.strictEqual(fee, 60);

      // Self pickup must always be 0
      const pickupFee = calculateDeliveryFee('SELF_PICKUP', 10, 20, 25, 2.5, 0.5);
      assert.strictEqual(pickupFee, 0);
    });

    it('should split delivery fees proportionally among community bulk-buy pool participants', () => {
      const unitBulkPrice = 22;
      const targetPoolKg = 50;
      const totalPoolDeliveryFee = 100;

      // 10 kg pledged out of 50 kg target:
      // deliveryShare = 10/50 * 100 = 20
      // subtotal = 10 * 22 = 220
      // totalEscrow = 220 + 20 = 240
      const split10Kg = calculateGroupSplitPayment(10, targetPoolKg, unitBulkPrice, totalPoolDeliveryFee);
      assert.strictEqual(split10Kg.deliveryShare, 20);
      assert.strictEqual(split10Kg.subtotal, 220);
      assert.strictEqual(split10Kg.totalEscrowAmount, 240);

      // 25 kg pledged out of 50 kg target:
      // deliveryShare = 25/50 * 100 = 50
      // subtotal = 25 * 22 = 550
      // totalEscrow = 550 + 50 = 600
      const split25Kg = calculateGroupSplitPayment(25, targetPoolKg, unitBulkPrice, totalPoolDeliveryFee);
      assert.strictEqual(split25Kg.deliveryShare, 50);
      assert.strictEqual(split25Kg.subtotal, 550);
      assert.strictEqual(split25Kg.totalEscrowAmount, 600);
    });
  });

  describe('3. Multilingual Farmer Voice Parser Logic', () => {
    it('should parse English farmer speech containing crop, quantity, and grade', () => {
      const transcript = 'I want to sell 150 kg of groundnuts bold kernel grade A harvested this month';
      const parsed = parseVoiceTranscript(transcript, 'en');

      assert.strictEqual(parsed.category, 'PEANUTS_OILSEEDS');
      assert.strictEqual(parsed.weightKg, 150);
      assert.strictEqual(parsed.qualityGrade, 'GRADE_A_BOLD');
    });

    it('should parse Hindi farmer speech containing pulses and rates', () => {
      const transcript = 'मेरे पास 200 किलो तूर दाल है साफ़ की हुई';
      const parsed = parseVoiceTranscript(transcript, 'hi');

      assert.strictEqual(parsed.category, 'PULSES_DALS');
      assert.strictEqual(parsed.weightKg, 200);
    });

    it('should parse Kannada farmer speech for spices and jowar', () => {
      const transcript = 'ನನ್ನ ಹತ್ತಿರ 80 ಕೆಜಿ ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ ಇದೆ';
      const parsed = parseVoiceTranscript(transcript, 'kn');

      assert.strictEqual(parsed.category, 'DRY_SPICES');
      assert.strictEqual(parsed.weightKg, 80);
    });
  });

});
