import { Request, Response } from 'express';
import { UserProfile } from '../types/profile.types';

let profiles: UserProfile[] = [];

export class ProfileController {
  static getProfile(req: Request, res: Response) {
    const { id } = req.params;
    const profile = profiles.find(p => p.id === parseInt(id));

    if (!profile) {
      res.status(404).json({ success: false, error: "Profile not found" });
      return;
    }

    res.json({ success: true, data: profile });
  }

  static updateProfile(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    let profile = profiles.find(p => p.id === parseInt(id));

    if (!profile) {
      // Create new profile if not exists (common in PATCH for simplicity in learning)
      profile = {
        id: parseInt(id),
        name: "Default Name",
        email: `user${id}@example.com`,
        bio: "",
        avatar: "",
        website: "",
        location: "",
        updatedAt: new Date()
      };
      profiles.push(profile);
    }

    // Apply partial updates
    Object.assign(profile, updates);
    profile.updatedAt = new Date();

    res.json({
      success: true,
      message: "Profile updated successfully (PATCH)",
      data: profile
    });
  }
}
