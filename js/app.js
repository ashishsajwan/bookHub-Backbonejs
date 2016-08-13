/**
* This is a backbone model which store
* the data for header View
*/
var HeaderStatsModel = Backbone.Model.extend({
  defaults: {
    "totalBooks": 0,
    "totalBookmarks": 0
  }
});

/**
* This is a backbone model which store
* the data for a book entity
*/
var BookModel = Backbone.Model.extend({
  initialize: function() {}
});


/**
* This is a backbone collection which store
* the list of books as collection
*/
var BooksList = Backbone.Collection.extend({
  model: BookModel,
  parse: function(data) {
    return data.books;
  },
  comparator: function(a, b) {
    a = this.sanitizeNumber(a.get(this.sort_key));
    b = this.sanitizeNumber(b.get(this.sort_key));
    return a < b ? 1 : a > b ? -1 : 0;
  },
  sanitizeNumber: function(string) {
    if (string) {
      return Number(string.replace(/[^0-9\.]+/g,""))
    }
  },
  url: 'https://capillary.0x10.info/api/books?type=json&query=list_books'
});

/**
* This is a backbone view which is responsible
* for rendering Header of the app
*/
var HeaderView = Backbone.View.extend({
  className: 'appHeader',
  initialize: function() {
    this.listenTo(this.model, 'sync', this.render);
    this.render();
  },
  render: function() {
    var headerTemplate = _.template($('#Tpl-header').html());
    this.$el.html(headerTemplate(this.model.toJSON()));
    $('#app-header-container').html(this.el);
  }
});

/**
* This is a backbone view which is responsible
* for rendering body of the app
*/
var BodyView = Backbone.View.extend({
  className: 'appBody',
  searchTerm: null,
  currentBook: null,
  events: {
    'enter input': 'searchBook',
    'click #button-group .button': 'sortBook',
    'click #reset-list': 'resetList',
    'click .book-list-view': 'checkBook',
    'click #bookmark-book': 'bookmarkBook',
    'click #show-bookmarks' : 'showBookmarks'
  },
  initialize: function(data) {
    this.render();
    /*
      When ever data inside collection is fetched from server 'sync' event
      will be triggered & then we can render the books as list inside this view
    */
    this.listenTo(this.collection, 'sync', this.renderBooksList);

    // lets fetch the data from servers
    this.collection.fetch();
  },
  /**
  * this is a utility method inside this view to reset the view
  * which helps removing all filters , sorting, search terms etc
  */
  resetList: function() {
    $('#search-container input').val('');
    $('.active').removeClass('active');
    $('#book-big-view-container').empty();
    this.renderBooksList();
  },
  /**
  * this method helps bookmarking a book
  */
  bookmarkBook: function() {
    if (localStorage.getItem(currentBook)) {
      localStorage.removeItem('bookmark-'+currentBook);
      $('#bookmark-book').removeClass('bookmark');
    } else {
      localStorage.setItem('bookmark-'+currentBook, 'bookmarked');
      $('#bookmark-book').addClass('bookmark');
    }
    this.model.set({
      'totalBookmarks': localStorage.length
    });
    this.model.trigger('sync');
  },

  /*
  * this method helps in checking the book in details.
  * on clicking on a row in book list , this method puts it's details
  * side by side
  */
  checkBook: function(e) {
    $('.book-list-view').removeClass('active');
    $(e.currentTarget).addClass('active');
    var bookIndex = $(e.currentTarget).attr('index');
    currentBook = bookIndex;
    var bookBigTemplate = _.template($('#Tpl-book-big-view').html());
    var isBookmarked = (localStorage.getItem('bookmark-'+currentBook)) ? true : false;
    $('#book-big-view-container').html(bookBigTemplate(_.extend(this.collection.get(bookIndex).toJSON(), {
      isBookmarked: isBookmarked
    })));
  },

  /**
  * This method helps in applying sorting on list
  */
  sortBook: function(e) {
    var sortBy = null;
    $('#button-group .active').removeClass('active');
    $(e.currentTarget).addClass('active');
    switch ($(e.currentTarget).attr('id')) {
      case 'price-sort':
        sortBy = 'price';
        break;
      case 'rating-sort':
        sortBy = 'rating';
        break;
    }
    this.collection.sort_key = sortBy;
    this.collection.sort_order = sortBy;
    this.collection.sort();
    this.renderBooksList();
  },

  /**
  * this method helps in listing down only bookmarked books
  */
  showBookmarks: function() {
    var list = _.filter(this.collection.models, function(book) {
      return book.get('isBookmarked');
    });
    $('#show-bookmarks').addClass('active');
    this.renderBooksList(list);
  },

  /**
  * This method helps in searching a term in the list of books
  */
  searchBook: function(e) {
    var that = this;
    var searchTerm = $(e.currentTarget).val();
    if (this.searchTerm != searchTerm) {
      if (_.isEmpty(searchTerm)) {
        this.renderBooksList();
      } else {
        var list = _.filter(that.collection.models, function(book) {
          if (book.get('name').toLowerCase().indexOf(searchTerm.toLowerCase()) != -1) {
            return true;
          }
          if (book.get('author').toLowerCase().indexOf(searchTerm.toLowerCase()) != -1) {
            return true;
          }
          if (book.get('rating').toLowerCase().indexOf(searchTerm.toLowerCase()) != -1) {
            return true;
          }
        });
        this.renderBooksList(list);
      }
      this.searchTerm = searchTerm;
    }
  },

  /*
  * This method helps rendering the list of books.
  * it takes argument LIST , which can be raw list of books,
  * OR list can contain only those books which passes search term
  * OR list can contain books in certain order (as a result of sort)s
  */
  renderBooksList: function(list) {
    this.model.set({
      'totalBooks':_.size(this.collection),
      'totalBookmarks': localStorage.length
    });
    this.model.trigger('sync');
    var list = list || this.collection.models;
    if (list.models) {
      list = this.collection.models;
    }
    $('#books-list-container').empty();
    _.each(list, function(book, key) {
      var isBookmarked = (localStorage.getItem('bookmark-'+book.cid)) ? true : false;
      book.set({
        'isBookmarked':isBookmarked
      });
      var bookListView = new BookListView({
        model: book,
        id: "#book-" + key
      });
      bookListView.$el.attr({
        'index': book.cid
      });
      $('#books-list-container').append(bookListView.el);
    });
  },

  /**
  * This method helps rendering the containers first on the page
  * so that list can be inserted in respective containers.
  * basically it just embeds the app body template to the DOM
  */
  render: function() {
    var bodyTemplate = _.template($('#Tpl-body').html());
    this.$el.html(bodyTemplate);
    $('#app-body-container').html(this.el);
  }
});

/**
* This is a backbone view which is responsible
* for rendering each book as single row in list
* inside app body
*/
var BookListView = Backbone.View.extend({
  className: 'book-list-view',
  initialize: function() {
    this.render();
  },
  render: function() {
    var bodyTemplate = _.template($('#Tpl-book-list').html());
    this.$el.html(bodyTemplate(this.model.toJSON()));
  }
});


$(document).ready(function() {
  // capturing enter key on inputs and firing enter event
  // so that pressing enter of searchbox works
  $(document).on('keyup', 'input', function(e) {
    if (e.keyCode == 13) {
      $(this).trigger('enter');
    }
  });
  // create a object of headerstatsModel
  var headerStatsModel = new HeaderStatsModel();

  // create a object of Bookslist
  var booksList = new BooksList();

  // create a object of Headerview
  // which will render header view of app
  var headerView = new HeaderView({
    model : headerStatsModel
  });

  // create a object of bodyView
  // which will render main body of the app
  var bodyView = new BodyView({
    model : headerStatsModel,
    collection : booksList
  });
});
