const fs = require('fs').promises;
const path = require('path');

class PersonalProfileManager {
  constructor(profileFilePath = null) {
    this.profileFilePath = profileFilePath || path.join(__dirname, 'public', 'personal_profile.json');
  }

  /**
   * Get the current personal profile
   */
  async getProfile() {
    try {
      const data = await fs.readFile(this.profileFilePath, 'utf-8');
      const profile = JSON.parse(data);
      return profile.data || {};
    } catch (error) {
      console.log('No personal profile file found, starting fresh');
      return {};
    }
  }

  /**
   * Update personal profile with new information
   * Duplicates will be overridden
   */
  async updateProfile(newInfo) {
    try {
      const currentProfile = await this.getProfile();
      
      // Merge new information with existing profile
      const updatedProfile = {
        ...currentProfile,
        ...newInfo
      };

      // Ensure the directory exists
      const dir = path.dirname(this.profileFilePath);
      await fs.mkdir(dir, { recursive: true });

      // Write the updated profile
      await fs.writeFile(this.profileFilePath, JSON.stringify({
        data: updatedProfile,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }, null, 2));

      console.log(`👤 Updated personal profile with ${Object.keys(newInfo).length} new items`);
      return updatedProfile;
    } catch (error) {
      console.error('❌ Error updating personal profile:', error);
      throw error;
    }
  }

  /**
   * Get a specific piece of personal information
   */
  async getPersonalInfo(key) {
    const profile = await this.getProfile();
    return profile[key] || null;
  }

  /**
   * Get all personal information
   */
  async getAllPersonalInfo() {
    return await this.getProfile();
  }

  /**
   * Clear all personal information
   */
  async clearProfile() {
    try {
      await fs.writeFile(this.profileFilePath, JSON.stringify({
        data: {},
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      }, null, 2));
      console.log('🗑️ Personal profile cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing personal profile:', error);
      return false;
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats() {
    const profile = await this.getProfile();
    return {
      totalFields: Object.keys(profile).length,
      fields: Object.keys(profile),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Export profile to file
   */
  async exportProfile(exportPath) {
    try {
      const profile = await this.getProfile();
      const exportData = {
        data: profile,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      };
      
      await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`📤 Exported personal profile to ${exportPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error exporting personal profile:', error);
      return false;
    }
  }

  /**
   * Import profile from file
   */
  async importProfile(importPath) {
    try {
      const data = await fs.readFile(importPath, 'utf-8');
      const importedProfile = JSON.parse(data);
      
      if (importedProfile.data && typeof importedProfile.data === 'object') {
        await this.updateProfile(importedProfile.data);
        console.log(`📥 Imported personal profile from ${importPath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error importing personal profile:', error);
      return false;
    }
  }
}

module.exports = PersonalProfileManager; 