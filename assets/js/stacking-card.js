function Util() { };

Util.osHasReducedMotion = function () {
    if (!window.matchMedia) return false;
    var matchMediaObj = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (matchMediaObj) return matchMediaObj.matches;
    return false;
};

(function () {
    var StackedCardsEffect = function (element) {
        this.element = element;
        this.items = this.element.getElementsByClassName('js-stack-cards__item');
        this.scrollingFn = false;
        this.scrolling = false;
        this.blurValue = 0;
        initStackedCardsEffect(this);
        initStackedCardsResize(this);
    };

    function initStackedCardsEffect(element) {
        setStackedCards(element);
        var observer = new IntersectionObserver(stackedCardsCallback.bind(element), { threshold: [0, 1] });
        observer.observe(element.element);
    }

    function initStackedCardsResize(element) {
        element.element.addEventListener('resize-stacked-cards', function () {
            setStackedCards(element);
            animateStackedCards.bind(element);
        });
    }

    function stackedCardsCallback(entries) {
        if (entries[0].isIntersecting) {
            if (this.scrollingFn) return;
            stackedCardsInitEvent(this);
        } else {
            if (!this.scrollingFn) return;
            window.removeEventListener('scroll', this.scrollingFn);
            this.scrollingFn = false;
            this.blurValue = 0;
            animateStackedCards.call(this);
        }
    }

    function stackedCardsInitEvent(element) {
        element.scrollingFn = stackedCardsScrolling.bind(element);
        window.addEventListener('scroll', element.scrollingFn);
    }

    function stackedCardsScrolling() {
        if (this.scrolling) return;
        this.scrolling = true;
        window.requestAnimationFrame(animateStackedCards.bind(this));
    }

    function setStackedCards(element) {
        element.marginY = getComputedStyle(element.element).getPropertyValue('--stack-cards-gap');
        getIntegerFromProperty(element);
        element.elementHeight = element.element.offsetHeight;

        var cardStyle = getComputedStyle(element.items[0]);
        element.cardTop = Math.floor(parseFloat(cardStyle.getPropertyValue('top')));
        element.cardHeight = Math.floor(parseFloat(cardStyle.getPropertyValue('height')));

        element.windowHeight = window.innerHeight;

        if (isNaN(element.marginY)) {
            element.element.style.paddingBottom = '0px';
        } else {
            element.element.style.paddingBottom = (element.marginY * (element.items.length - 1)) + 'px';
        }

        for (var i = 0; i < element.items.length; i++) {
            if (isNaN(element.marginY)) {
                element.items[i].style.transform = 'none;';
            } else {
                element.items[i].style.transform = 'translateY(' + element.marginY * i + 'px)';
            }
        }
    }

    function getIntegerFromProperty(element) {
        var node = document.createElement('div');
        node.setAttribute('style', 'opacity:0; visibility: hidden; position: absolute; height:' + element.marginY);
        element.element.appendChild(node);
        element.marginY = parseInt(getComputedStyle(node).getPropertyValue('height'));
        element.element.removeChild(node);
    }

    function animateStackedCards() {
        if (isNaN(this.marginY)) {
            this.scrolling = false;
            return;
        }

        var top = this.element.getBoundingClientRect().top;

        if (this.cardTop - top + this.element.windowHeight - this.elementHeight - this.cardHeight + this.marginY + this.marginY * this.items.length > 0) {
            this.scrolling = false;
            return;
        }

        for (var i = 0; i < this.items.length; i++) {
            var scrolling = this.cardTop - top - i * (this.cardHeight + this.marginY);
            var scaling = i == this.items.length - 1 ? 1 : Math.min(1, Math.max(0, (this.cardHeight - scrolling * 0.13) / this.cardHeight));
            this.items[i].style.transform = 'translateY(' + this.marginY * i + 'px) scale(' + scaling + ')';

            if (i !== this.items.length - 1) {
                this.blurValue = Math.min(5, Math.max(0, scrolling * 0.1));
                this.items[i].style.filter = 'blur(' + this.blurValue + 'px)';
            } else {
                this.items[i].style.filter = 'none';
            }
        }

        this.scrolling = false;
    }

    var stackCards = document.getElementsByClassName('js-stack-cards'),
        intersectionObserverSupported = ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype),
        reducedMotion = Util.osHasReducedMotion();

    if (stackCards.length > 0 && intersectionObserverSupported && !reducedMotion) {
        var stackCardsArray = [];
        for (var i = 0; i < stackCards.length; i++) {
            (function (i) {
                stackCardsArray.push(new StackedCardsEffect(stackCards[i]));
            })(i);
        }

        var resizingId = false,
            customEvent = new CustomEvent('resize-stacked-cards');

        window.addEventListener('resize', function () {
            clearTimeout(resizingId);
            resizingId = setTimeout(doneResizing, 500);
        });

        function doneResizing() {
            for (var i = 0; i < stackCardsArray.length; i++) {
                (function (i) { stackCardsArray[i].element.dispatchEvent(customEvent) })(i);
            }
        }
    }
}());
