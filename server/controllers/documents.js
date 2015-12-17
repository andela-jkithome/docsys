(function() {
  'use strict';
  var Document = require('../models/documents');
  var User = require('../models/users');
  var Roles = require('../models/roles');
  var async = require('async');

  module.exports = {

    create: function(req, res) {
      var document = new Document();

      var saveDocument = function() {
        document.title = req.body.title;
        document.content = req.body.content;
        document.owner = req.decoded._id;
        document.genre = req.body.genre;

        document.save(function(err) {
          if (err) {
            res.send(err);
          } else {
            res.json({
              message: 'Document created successfully.',
              doc: document
            });
          }
        });
      };

      var roleFind = function(aRole, callback) {
        console.log(aRole);
        Roles.findOne({
          title: aRole
        }, function(err, role) {
          if (err) {
            res.send(err);
          } else {
            return callback(null, role._id);
          }
        });
      };


      if (req.body.access) {
        var granted = (req.body.access).trim().replace(/\s/g, '').split(',');
        async.map(granted, roleFind, function(err, results) {
          if (err) {
            res.send(err);
          } else {
            document.access = results;
            saveDocument();
          }
        });
      } else {
        var defaultRoles = ['user', 'admin', 'staff'];
        async.map(defaultRoles, roleFind, function(err, results) {
          if (err) {
            res.send(err);
          } else {
            document.access = results;
            saveDocument();
          }
        });
      }
    },

    update: function(req, res) {
      Document.findById(req.params.id, function(req, document) {
        if (err) {
          res.send(err);
        } else {
          var saveDocument = function() {
            if (req.body.title) {
              document.title = req.body.title;
            }
            if (req.body.content) {
              document.content = req.body.content;
            }
            if (req.body.genre) {
              document.genre = req.body.genre;
            }

            document.save(function(err) {
              if (err) {
                res.send(err);
              } else {
                res.json({
                  message: 'Document updated successfully.'
                });
              }
            });
          };

          var roleFind = function(aRole, callback) {
            console.log(aRole);
            Roles.findOne({
              title: aRole
            }, function(err, role) {
              if (err) {
                res.send(err);
              } else {
                return callback(null, role._id);
              }
            });
          };


          if (req.body.access) {
            var granted = (req.body.access).trim().replace(/\s/g, '').split(',');
            async.map(granted, roleFind, function(err, results) {
              if (err) {
                res.send(err);
              } else {
                document.access = results;
                saveDocument();
              }
            });
          } else {
            saveDocument();
          }
        }
      });
    },

    delete: function(req, res) {
      Document.findById(req.params.id, function(err, document) {
        if (err) {
          res.send(err);
        } else {
          // data exists, remove it.
          document.remove({
            _id: req.params.id
          }, function(err) {
            if (err) {
              res.send(err);
            } else {
              res.json({
                'message': 'Document deleted successfully.'
              });
            }
          });
        }
      });
    },

    // Return all documents.
    all: function(req, res) {
      Document
        .find({}, function(err, documents) {
          if (err) {
            res.send(err);
          } else {
            res.json(documents);
          }
        })
        // Populate the owner field
        .populate('owner')
        // Return only a given number
        .limit(req.params.limit)
        // By latest created
        .sort({
          createdAt: -1
        });
    },

    // Find a single document
    find: function(req, res) {
      Document.findById(req.params.id, function(err, document) {
        if (err) {
          res.send(err);
        } else {
          res.json(document);
        }
      });
    },

    // Return all documents belonging to a particular genre
    allByGenre: function(req, res) {
      var genre = req.params.genre;
      // Create case insensitive regular expression
      var re = new RegExp(genre, "gi");
      Document.find({
        genre: re
      }, function(err, documents) {
        if (err) {
          res.send(err);
        } else {
          res.json(documents);
        }
      });
    },

    // REturn all documents with a particular word in the content
    allByContent: function(req, res) {
      var searchterm = req.params.term;
      var re = new RegExp(searchterm, "gi");
      Document.find({
        content: {
          $regex: re
        }
      }, function(err, documents) {
        if (err) {
          res.send(err);
        } else {
          res.json(documents);
        }
      });
    },

    // Return all the documents that can be accessed by a role
    allByRole: function(req, res) {
      var role = req.params.role;
      Roles.findOne({
        title: role
      }, function(err, roleO) {
        if (err) {
          res.send(err);
        } else {
          var roleId = roleO._id;
          // Find all documents with the role id in access field.
          Document.find({
              access: roleId
            }, function(err, documents) {
              if (err) {
                res.json(err);
              } else {
                res.json(documents);
              }
            })
            .limit(req.params.limit);
        }
      });
    },

    allByUser: function(req, res) {
      var userId = req.params.id;
      User.findById(userId, function(err, user) {
        if (err) {
          res.send(err);
        } else {
          var userRole = user.role;
          // Find documents the users owns or can access.
          Document.find({
            $or: [{
              owner: userId
            }, {
              access: userRole
            }]
          }, function(err, documents) {
            if (err) {
              res.send(err);
            } else {
              res.json(documents);
            }
          });
        }
      });
    },

    // Get all documents created on a specific date. Midnight to midnight
    allByDate: function(req, res) {
      var start = new Date(req.params.year, (req.params.month - 1), req.params.day);
      var end = new Date(start.getTime() + (24 * 60 * 60 * 1000));
      Document.find({
        createdAt: {
          $gte: start,
          $lt: end
        }
      }, function(err, documents) {
        if (err) {
          res.send(err);
        } else {
          res.json(documents);
        }
      }).
      limit(req.params.limit).
      sort({
        createdAt: -1
      });
    }
  };
})();