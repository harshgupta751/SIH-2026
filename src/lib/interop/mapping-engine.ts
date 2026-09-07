import { CommonCitizenRecord, FieldMappingRule, RevNetCitizenResponse, MuniSysApplicationPayload } from './types';

/**
 * Dynamic Data Mapping Engine
 * Resolves nested paths (e.g. "citizen.fullName", "address_record.city_name")
 * and transforms data between disparate departmental schemas and the Common Data Model (CDM).
 */
export class DataMappingEngine {
  /**
   * Helper to safely extract a nested value using dot notation
   */
  public static getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return current;
  }

  /**
   * Helper to set a nested value using dot notation
   */
  public static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Transform RevNet (Revenue Department) idiosyncratic payload into standard CommonCitizenRecord
   */
  public static transformRevenueToCDM(
    raw: RevNetCitizenResponse,
    customRules?: FieldMappingRule[]
  ): CommonCitizenRecord {
    // Default standard mapping rules if not overridden
    const fullName = this.getNestedValue(raw, 'citizen.fullName') || 'Unknown';
    const mobile = this.getNestedValue(raw, 'citizen.mobile') || '';
    const aadhaarHash = this.getNestedValue(raw, 'citizen.aadhaarHash') || '';

    const houseNo = this.getNestedValue(raw, 'address_record.house_no') || '';
    const locality = this.getNestedValue(raw, 'address_record.locality') || '';
    const city = this.getNestedValue(raw, 'address_record.city_name') || '';
    const pin = this.getNestedValue(raw, 'address_record.pin') || '';
    const district = this.getNestedValue(raw, 'address_record.district_name') || '';
    const state = this.getNestedValue(raw, 'address_record.state_code') || '';
    const landHolding = this.getNestedValue(raw, 'address_record.land_holding_sqft') || 0;
    const propertyTaxCleared = Boolean(this.getNestedValue(raw, 'address_record.property_tax_cleared'));
    const isVerified = raw.verification_status === 'VERIFIED_ACTIVE';

    const formattedAddress = `${houseNo}, ${locality}, ${city}, ${district} - ${pin}, ${state}`;

    const cdm: CommonCitizenRecord = {
      citizenId: `CIT-${mobile.slice(-4) || '1023'}`,
      name: fullName,
      mobile: mobile,
      identityHash: aadhaarHash,
      address: {
        line1: houseNo,
        locality: locality,
        city: city,
        district: district,
        state: state,
        postalCode: pin,
        fullFormattedAddress: formattedAddress,
      },
      clearances: {
        revenueVerified: isVerified,
        revenueReferenceId: `REV-CLR-${Date.now().toString().slice(-6)}`,
        propertyTaxCleared: propertyTaxCleared,
        landHoldingSqft: landHolding,
      },
    };

    // Apply any dynamic custom rule overrides
    if (customRules && customRules.length > 0) {
      for (const rule of customRules) {
        if (rule.sourceSystem === 'RevNet' && rule.targetSystem === 'MahaSetu_CDM') {
          const val = this.getNestedValue(raw, rule.sourceField);
          if (val !== undefined) {
            this.setNestedValue(cdm, rule.targetField, val);
          }
        }
      }
    }

    return cdm;
  }

  /**
   * Transform Common Data Model (CDM) into Municipal Department (MuniSys) idiosyncratic format
   */
  public static transformCDMToMunicipal(
    cdm: CommonCitizenRecord,
    businessTitle: string,
    tradeCategory: string = 'COMMERCIAL_RETAIL'
  ): MuniSysApplicationPayload {
    return {
      applicant_name: cdm.name,
      phone_number: cdm.mobile,
      business_title: businessTitle,
      premises_address: cdm.address.fullFormattedAddress,
      ward_no: `WARD-${cdm.address.city === 'Pune' ? '14' : '01'}`,
      trade_category: tradeCategory,
      revenue_clearance_ref: cdm.clearances.revenueReferenceId || null,
      property_tax_cleared_flag: Boolean(cdm.clearances.propertyTaxCleared),
      approval_state: cdm.clearances.revenueVerified
        ? 'PENDING_MUNICIPAL_VERIFICATION'
        : 'PENDING_REVENUE_VERIFICATION',
    };
  }

  /**
   * Generic transformer using configured mapping rules
   */
  public static executeMapping(
    sourceData: any,
    rules: FieldMappingRule[]
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const rule of rules) {
      let val = this.getNestedValue(sourceData, rule.sourceField);
      if (val !== undefined) {
        if (rule.transformation === 'TO_UPPER' && typeof val === 'string') {
          val = val.toUpperCase();
        } else if (rule.transformation === 'BOOLEAN_FLAG') {
          val = Boolean(val);
        } else if (rule.transformation === 'FORMAT_MOBILE' && val != null) {
          val = String(val).replace(/\D/g, '').slice(-10);
        } else if (rule.transformation === 'CONCAT_ADDRESS' && typeof val === 'string') {
          val = val.trim();
        }
        this.setNestedValue(result, rule.targetField, val);
      }
    }
    return result;
  }
}
