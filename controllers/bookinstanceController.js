const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const async = require('async');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


const status_options = ['Maintenance', 'Available', 'Loaned', 'Reserved'];


exports.bookinstance_list = function(req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function(err, list_bookinstances) {
      if (err) return next(err);
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
};

exports.bookinstance_detail = function(req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
      if (err) return next(err);
      if (bookinstance==null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title,
        bookinstance: bookinstance
      });
    });
};

exports.bookinstance_create_get = function(req, res, next) {
  Book.find({}, 'title')
    .exec(function(err, books) {
      if (err) return next(err);
      res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, status_options: status_options });
    });
};

exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .exec(function(err, books) {
          if (err) return next(err);
          res.render('bookinstance_form', { title: 'Create BookInstance', 
            book_list: books, selected_book: bookinstance.book._id, 
            errors: errors.array(), bookinstance: bookinstance, 
            status_options: status_options });
        });
      return;
    } else {
      bookinstance.save(function(err) {
        if (err) return next(err);
        res.redirect(bookinstance.url);
      });
    }
  }
];

exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance
    .findById(req.params.id)
    .exec(function(err, bookinstance) {
      if (err) return next(err);
      res.render('bookinstance_delete', { title: 'Delete Book Instance',
        bookinstance });
    });
};

exports.bookinstance_delete_post = function(req, res, next) {
  BookInstance
    .findById(req.body.bookinstanceid)
    .exec(function(err, bookinstance) {
      if (err) return next(err);
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, 
        function deleteBookInstance(err) {
          if (err) return next(err);
          res.redirect('/catalog/bookinstances');
        });
    });
};

exports.bookinstance_update_get = function(req, res, next) {
  async.parallel({
    bookinstance: function(callback) {
      BookInstance
        .findById(req.params.id)
        .exec(callback);
    },
    books: function(callback) {
      Book.find({}, 'title').exec(callback);
    }
  }, function(err, results) {
       if (err) return next(err);
       if (results.bookinstance==null) {
         const err = new Error('Book Instance not found');
         err.status = 404;
         return next(err);
       }
       res.render('bookinstance_form', { title: 'Update Book Instance',
         book_list: results.books, bookinstance: results.bookinstance, 
         status_options
       });
  })
};

exports.bookinstance_update_post = [
  body('book', 'Book must be specified.').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified.').trim().isLength({ min: 1 }),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  sanitizeBody('body').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      Book.find({}, 'title')
        .exec(function(err, books) {
          if (err) return next(err);
          res.render('bookinstance_form', { title: 'Update Book Instance',
            book_list: books, bookinstance, status_options,
            errors: errors.array() });
        });
      return;
    } else {
      bookinstance.save(function(err) {
        if (err) return next(err);
        res.redirect(bookinstance.url);
      });
    }
  }

];