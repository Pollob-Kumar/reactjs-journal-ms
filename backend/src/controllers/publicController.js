const Manuscript = require('../models/Manuscript');
const Issue = require('../models/Issue');
const { MANUSCRIPT_STATUS } = require('../config/constants');

// @desc    Search published articles
// @route   GET /api/public/search
// @access  Public
exports.searchArticles = async (req, res, next) => {
  try {
    const { q, author, keyword, page = 1, limit = 10 } = req.query;

    let query = { status: MANUSCRIPT_STATUS.PUBLISHED };

    if (q) {
      // Text search across title and abstract
      query.$text = { $search: q };
    }

    if (author) {
      query.$or = [
        { 'authors.firstName': { $regex: author, $options: 'i' } },
        { 'authors.lastName': { $regex: author, $options: 'i' } }
      ];
    }

    if (keyword) {
      query.keywords = { $in: [new RegExp(keyword, 'i')] };
    }

    const manuscripts = await Manuscript.find(query)
      .select('manuscriptId title abstract keywords authors doi publishedDate publishedIn')
      .populate('publishedIn', 'volume issueNumber year')
      .sort({ publishedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Manuscript.countDocuments(query);

    res.status(200).json({
      success: true,
      data: manuscripts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current issue
// @route   GET /api/public/current-issue
// @access  Public
exports.getCurrentIssue = async (req, res, next) => {
  try {
    const currentIssue = await Issue.findOne({ isPublished: true })
      .populate({
        path: 'manuscripts.manuscript',
        select: 'manuscriptId title authors abstract keywords doi publishedDate'
      })
      .sort({ year: -1, volume: -1, issueNumber: -1 });

    if (!currentIssue) {
      return res.status(404).json({
        success: false,
        message: 'No published issue found'
      });
    }

    res.status(200).json({
      success: true,
      data: currentIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get archived issues
// @route   GET /api/public/archives
// @access  Public
exports.getArchives = async (req, res, next) => {
  try {
    const { year, page = 1, limit = 10 } = req.query;

    let query = { isPublished: true };

    if (year) {
      query.year = parseInt(year);
    }

    const issues = await Issue.find(query)
      .select('volume issueNumber title year publishedDate')
      .sort({ year: -1, volume: -1, issueNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Issue.countDocuments(query);

    // Get distinct years for filtering
    const years = await Issue.distinct('year', { isPublished: true });

    res.status(200).json({
      success: true,
      data: issues,
      availableYears: years.sort((a, b) => b - a),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get published article by manuscript ID
// @route   GET /api/public/articles/:manuscriptId
// @access  Public
exports.getArticle = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findOne({
      manuscriptId: req.params.manuscriptId,
      status: MANUSCRIPT_STATUS.PUBLISHED
    })
      .populate('publishedIn', 'volume issueNumber year title')
      .select('-reviews -timeline -files -revisions');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get article statistics
// @route   GET /api/public/stats
// @access  Public
exports.getPublicStats = async (req, res, next) => {
  try {
    const totalArticles = await Manuscript.countDocuments({ status: MANUSCRIPT_STATUS.PUBLISHED });
    const totalIssues = await Issue.countDocuments({ isPublished: true });
    const totalVolumes = await Issue.distinct('volume', { isPublished: true });

    res.status(200).json({
      success: true,
      data: {
        totalArticles,
        totalIssues,
        totalVolumes: totalVolumes.length
      }
    });
  } catch (error) {
    next(error);
  }
};