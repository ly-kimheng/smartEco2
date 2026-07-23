import TipsGuide from '../models/TipsGuide.js';

// Mirrors BackEnd/src/controllers/rewardController.js conventions.
class GuideController {
  // Citizens only ever see published guides; admins see everything
  // (including drafts) so they can review before publishing.
  static async getGuides(req, res) {
    try {
      const publishedOnly = req.user?.role !== 'admin';
      const guides = await TipsGuide.getAll({ publishedOnly });
      res.status(200).json({ success: true, data: guides });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createGuide(req, res) {
    try {
      const { title, category, content, isPublished } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'title and content are required fields' });
      }

      const imageUrl = req.file ? `/uploads/guides/${req.file.filename}` : (req.body.imageUrl || null);

      const guide = await TipsGuide.create({
        title,
        category,
        content,
        imageUrl,
        isPublished,
        createdBy: req.user?.id || null,
      });
      res.status(201).json({ success: true, message: 'Guide created successfully', data: guide });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateGuide(req, res) {
    try {
      const { id } = req.params;
      const { title, category, content, isPublished } = req.body;

      const existing = await TipsGuide.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Guide not found' });
      }

      // Same precedence as create: new file > new pasted URL > keep the
      // existing image, so editing text fields never wipes it out.
      const imageUrl = req.file
        ? `/uploads/guides/${req.file.filename}`
        : (req.body.imageUrl || existing.image_url);

      const guide = await TipsGuide.update(id, {
        title: title ?? existing.title,
        category: category ?? existing.category,
        content: content ?? existing.content,
        imageUrl,
        isPublished: isPublished === undefined ? !!existing.is_published : isPublished,
      });
      res.status(200).json({ success: true, message: 'Guide updated successfully', data: guide });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteGuide(req, res) {
    try {
      const { id } = req.params;
      const success = await TipsGuide.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Guide not found or already deleted' });
      }
      res.status(200).json({ success: true, message: 'Guide deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default GuideController;
