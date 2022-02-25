$(function () {
    /**
     * Get Wishlists
     */
    var wishlists = [];

    function wishlistsRefresh() {
        $('.ui.dropdown.wishlists').api({
            action: 'get wishlists',
            method: 'GET',
            on: 'now',
            onSuccess: function (response, element, xhr) {
                wishlists = response.results;

                element.dropdown({
                    values: wishlists,
                    placeholder: 'No wishlist selected.'
                })

                if (urlParams.has('wishlist')) {
                    element.dropdown('set selected', urlParams.get('wishlist'));
                } else {
                    if (wishlists[0]) {
                        element.dropdown('set selected', wishlists[0].value);
                    }
                }
            }
        });
    }

    wishlistsRefresh();

    /**
     * Selection
     */
    var progress = $('.ui.progress');

    $(document).on('change', '.ui.dropdown.wishlists', function () {
        var wishlistValue = $('.ui.dropdown.wishlists').dropdown('get value');
        var wishlistIndex = $('.ui.dropdown.wishlists select').prop('selectedIndex') - 1;

        progress.progress('reset');
        progress.addClass('indeterminate');

        $('[name="wishlist_delete_id"]').val(wishlistValue);

        if (wishlistValue) {
            urlParams.set('wishlist', wishlistValue);
            window.history.pushState({}, '', '/?' + urlParams.toString());

            $('.wishlist-share').attr('href', '/?wishlist=' + wishlists[wishlistIndex].hash);

            $('.button.wishlist-product-add').removeClass('disabled');
            $('.button.wishlist-share').removeClass('disabled');
            $('.wishlist-delete button').removeClass('disabled');
        } else {
            $('.button.wishlist-product-add').addClass('disabled');
            $('.button.wishlist-share').addClass('disabled');
            $('.wishlist-delete button').addClass('disabled');
        }

        /**
         * Cards
         */
        if (wishlistIndex >= 0) {
            $('.wishlist-cards').html(wishlists[wishlistIndex].cards);
        } else {
            $('.wishlist-cards').html('');
        }

        /**
         * Generate cache
         */
        var cards = $('.ui.card[data-cache="false"]');

        if (cards.length > 0) {
            progress.slideDown();
            progress.removeClass('indeterminate');
            progress.progress({
                total: cards.length
            });
        } else {
            progress.slideUp();
        }

        var timerInterval = 1200;
        var timerCache = setTimeout(
            function generateCacheCards() {
                var cards = $('.ui.card[data-cache="false"]');

                cards.each(function (index, card) {
                    generateCacheCard(card);

                    if (index >= 0) {
                        return false;
                    }
                });

                if (cards.length > 0) {
                    setTimeout(generateCacheCards, timerInterval);
                }
            },
            0
        );
    });

    function generateCacheCard(card) {
        card = $(card);

        var href       = card.find('.content [href]').prop('href');
        var product_id = card.data('id');
        var refresh    = card.find('button.refresh');

        card.addClass('loading');
        card.attr('data-cache', true);

        fetch('/src/api/cache.php?product_id=' + product_id + '&product_url=' + href, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                var info = response.data;

                /**
                 * Elements
                 */
                var elementImage = card.children('.image');
                var elementContent = card.children('.content').first();
                var elementDetails = card.children('.extra.content.details');
                var elementButtons = card.children('.extra.content.buttons');

                /**
                 * Image
                 */
                if (info.image) {
                    if (!elementImage.length) {
                        card.prepend(
                            '<div class="image">' +
                                '<img class="preview" src="' + info.image + '" loading="lazy">' +
                            '</div>'
                        );
                    } else {
                        elementImage.children('img').attr('src', info.image);
                    }
                }

                /** Favicon */
                if (info.favicon) {
                    var elementFavicon = elementImage.children('img.favicon');

                    if (!elementFavicon.length) {
                        elementImage.children().first().after(
                            '<img class="favicon" src="' + info.favicon + '" loading="lazy">'
                        );
                    } else {
                        elementFavicon.attr('src', info.favicon);
                    }
                }

                /** Provider name */
                if (info.providerName) {
                    var elementProviderName = elementImage.children('span.provider');

                    if (!elementProviderName.length) {
                        $('<span class="provider">' + info.providerName + '</span>').insertBefore(elementImage.children().last());
                    } else {
                        elementProviderName.text(info.providerName);
                    }
                }

                /**
                 * Header
                 */
                var elementContentHeader = elementContent.children('.header');
                var elementContentHeaderTitle = elementContentHeader.children('a');

                /** Title */
                if (info.title) {
                    elementContentHeaderTitle.text(info.title);
                }

                /**
                 * Meta
                 */
                var elementContentMeta = elementContent.children('.meta');

                if (info.keywords.length) {
                    if (!elementContentMeta.length) {
                        elementContent.append(
                            '<div class="meta">' + info.keywords.join(', ') + '</div>'
                        );
                    }
                }

                /**
                 * Description
                 */
                var elementContentDescription = elementContent.children('.description');

                if (info.description) {
                    if (!elementContentDescription.length) {
                        elementContent.append(
                            '<div class="description">' + info.description + '</div>' +
                            '<div class="description-fade"></div>'
                        );
                    }
                }

                /**
                 * Finish
                 */
                card.removeClass('loading');
                progress.progress('increment');
            }

            refresh.removeClass('working');
        });
    }

    /**
     * Refresh
     */
    $(document).on('click', '.ui.button.refresh', function (event) {
        var button = $(event.currentTarget);
        var card = button.closest('.ui.card');

        button.addClass('working');

        generateCacheCard(card);
    });

    /**
     * Delete Wishlist
     */
    $(document).on('submit', '.wishlist-delete', function (event) {
        event.preventDefault();

        var wishlistValue = $('.ui.dropdown.wishlists').dropdown('get value');

        if (wishlistValue) {
            var modalDefault = $('.ui.modal.default');

            modalDefault
            .modal({
                title: 'Really delete?',
                class: 'tiny',
                content: 'Do you really want to delete the wishlist <strong>' + $('.ui.dropdown.wishlists').dropdown('get text') + '</strong>?',
                actions: [
                    {
                        text: 'Yes, delete',
                        class: 'approve red'
                    },
                    {
                        text: 'No, keep',
                        class: 'deny'
                    },
                ],
                onApprove: function (buttonApprove) {
                    buttonApprove.addClass('loading');

                    $('.ui.dropdown.wishlists').api({
                        action: 'delete wishlist',
                        method: 'DELETE',
                        data: {
                            wishlistID: wishlistValue
                        },
                        on: 'now',
                        onSuccess: function (response, wishlists) {
                            $('.wishlist-cards .column').fadeOut();

                            wishlists.dropdown('clear');

                            urlParams.delete('wishlist');

                            $('body').toast({
                                class:    'success',
                                showIcon: 'check',
                                message:  'Wishlist successfully deleted.'
                            });

                            wishlistsRefresh();

                            modalDefault.modal('hide');
                        }
                    });

                    /**
                     * Return false is currently not working.
                     *
                     * @version 2.8.8
                     * @see     https://github.com/fomantic/Fomantic-UI/issues/2105
                     */
                    return false;
                }
            })
            .modal('show');
        }
    });

    /**
     * Delete Product
     */
    $(document).on('click', '.ui.button.delete', function () {
        var button       = $(this);
        var card         = button.closest('.ui.card');
        var column       = card.closest('.column');
        var modalDefault = $('.ui.modal.default');

        modalDefault
        .modal({
            title: 'Really delete?',
            content: '<p>Would you really like to delete to this product? It will be gone forever.</p>',
            class: 'tiny',
            actions: [
                {
                    text: 'Yes, delete',
                    class: 'approve primary'
                },
                {
                    text: 'Cancel'
                }
            ],
            onApprove: function (buttonApprove) {
                buttonApprove.addClass('loading');

                /**
                 * Delete product
                 */
                button.api({
                    action: 'delete product',
                    method: 'DELETE',
                    data: {
                        productID: card.data('id'),
                    },
                    on: 'now',
                    onSuccess: function () {
                        column.fadeOut();

                        $('body').toast({
                            class:   'success',
                            showIcon: 'check',
                            message:  'Product successfully deleted.'
                        });

                        wishlistsRefresh();

                        modalDefault.modal('hide');
                    },
                });

                /**
                 * Return false is currently not working.
                 *
                 * @version 2.8.8
                 * @see     https://github.com/fomantic/Fomantic-UI/issues/2105
                 */
                return false;
            }
        })
        .modal('show');
    });

    /**
     * Add product
     */
    $(document).on('click', '.button.wishlist-product-add', function () {
        var modalWishlistProductAdd = $('.ui.modal.wishlist-product-add');

        modalWishlistProductAdd.find('[name="wishlist_id"]').val($('.ui.dropdown.wishlists').dropdown('get value'));
        modalWishlistProductAdd.find('.primary.approve.button').addClass('disabled');

        modalWishlistProductAdd
        .modal({
            onApprove: function (button) {
                button.addClass('loading');

                var form = $('.ui.form.wishlist-product-fetch');
                var formData = new URLSearchParams();
                formData.append('wishlist_id', form.find('input[name="wishlist_id"]').val());
                formData.append('product_url', form.find('input[name="product_url"]').val());

                fetch('/src/api/products.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(response => {
                    if (response.success) {
                        $('body').toast({
                            class:    'success',
                            showIcon: 'check',
                            message:  'Product successfully added.'
                        });

                        wishlistsRefresh();

                        modalWishlistProductAdd.modal('hide');
                    }

                    button.removeClass('loading');
                });

                return false;
            }
        })
        .modal('show');
    });

    /** Fetch */
    $(document).on('submit', '.wishlist-product-fetch', function (event) {
        event.preventDefault();

        var form = $(event.currentTarget);
        var href = form.find('[name="product_url"]').val();

        var elementModalAdd = $('.ui.modal.wishlist-product-add');
        var elementButtons  = elementModalAdd.find('.actions .button');
        var elementImage    = elementModalAdd.find('.image img');

        form.addClass('loading');
        elementButtons.addClass('disabled');

        fetch('/src/api/cache.php?product_url=' + href, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                var info = response.data;

                /**
                 * Image
                 */
                if (info.image && elementImage.length) {
                    elementImage.attr('src', info.image);
                }

                /**
                 * URL
                 */
                if (info.url && info.url !== href) {
                    var elementModalFetch = $('.ui.modal.wishlist-product-fetch');

                    elementModalFetch.find('input.current').val(href);
                    elementModalFetch.find('input.proposed').val(info.url);

                    elementButtons.addClass('disabled');

                    elementModalFetch
                    .modal({
                        allowMultiple: true,
                        closable: false,
                        onApprove: function (buttonFetch) {
                            var formData = new URLSearchParams();
                            formData.append('product_url_current', href);
                            formData.append('product_url_proposed', info.url);

                            buttonFetch.addClass('loading');

                            fetch('/src/api/products.php', {
                                method: 'PUT',
                                body: formData
                            })
                            .then(response => response.json())
                            .then(response => {
                                if (response.success) {
                                    form.find('input[type="url"]').val(info.url);

                                    elementModalFetch.modal('hide');
                                }

                                buttonFetch.removeClass('loading');
                            });

                            return false;
                        },
                        onHide: function() {
                            form.removeClass('loading');
                            elementButtons.removeClass('disabled');
                        }
                    })
                    .modal('show');
                } else {
                    form.removeClass('loading');
                    elementButtons.removeClass('disabled');
                }
            }
        });
    });

    /**
     * Create wishlist
     */
     $(document).on('click', '.button.wishlist-create', function () {
        var modalWishlistCreate = $('.ui.modal.wishlist-create');
        var formWishlistCreate  = modalWishlistCreate.find('.ui.form');

        modalWishlistCreate
        .modal({
            onApprove: function (buttonCreate) {
                const formData = new URLSearchParams(new FormData(formWishlistCreate[0]));

                formWishlistCreate.addClass('loading');
                buttonCreate.addClass('loading');

                fetch('/src/api/wishlists.php', {
                    method: 'POST',
                    body:   formData
                })
                .then(response => response.json())
                .then(response => {
                    if(response.success) {
                        modalWishlistCreate.modal('hide');

                        urlParams.set('wishlist', response.data.lastInsertId);

                        $('body').toast({
                            class: 'success',
                            showIcon: 'check',
                            message: 'Wishlist successfully created.'
                        });

                        wishlistsRefresh();
                    }
                })
                .finally(() => {
                    formWishlistCreate.removeClass('loading');
                    buttonCreate.removeClass('loading');
                });

                return false;
            }
        })
        .modal('show');
    });

});