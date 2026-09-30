/**
 * THẢO VY STORE - ONLY PAGE TRANSITIONS ENGINE
 */

(function () {
    'use strict';

    /* ==========================================================================
       1. TOP LOADING PROGRESS BAR & PAGE ENTRY
       ========================================================================== */

    let progressBar = null;

    function initProgressBar() {
        if (document.getElementById('page-progress-bar')) return;
        progressBar = document.createElement('div');
        progressBar.id = 'page-progress-bar';
        document.body.appendChild(progressBar);
    }

    function setProgress(percent) {
        if (!progressBar) initProgressBar();
        if (progressBar) {
            progressBar.style.opacity = '1';
            progressBar.style.width = percent + '%';
        }
    }

    function finishProgress() {
        if (!progressBar) return;
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.opacity = '0';
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 300);
        }, 150);
    }

    function markPageLoaded() {
        document.body.classList.remove('page-exiting');
        document.body.classList.add('page-loaded');
        finishProgress();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initProgressBar();
            setProgress(60);
            setTimeout(markPageLoaded, 50);
        });
    } else {
        initProgressBar();
        markPageLoaded();
    }

    window.addEventListener('pageshow', function (event) {
        document.body.classList.remove('page-exiting');
        document.body.classList.add('page-loaded');
        finishProgress();
    });

    /* ==========================================================================
       2. INTERCEPT LINKS FOR SMOOTH PAGE EXIT TRANSITION
       ========================================================================== */

    function isInternalLink(anchor) {
        if (!anchor || !anchor.href) return false;
        
        const href = anchor.getAttribute('href') || '';
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('tel:') || href.startsWith('mailto:')) {
            return false;
        }

        if (anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.classList.contains('no-transition')) {
            return false;
        }

        try {
            const url = new URL(anchor.href, window.location.href);
            return url.origin === window.location.origin;
        } catch (e) {
            return false;
        }
    }

    function navigateWithTransition(targetUrl) {
        if (!targetUrl || targetUrl === window.location.href) return;

        setProgress(75);
        document.body.classList.add('page-exiting');

        setTimeout(() => {
            window.location.href = targetUrl;
        }, 700);
    }

    document.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        const anchor = e.target.closest('a');
        if (anchor && isInternalLink(anchor)) {
            const targetUrl = anchor.href;

            const currentUrl = new URL(window.location.href);
            const nextUrl = new URL(targetUrl);
            if (currentUrl.pathname === nextUrl.pathname && nextUrl.hash) {
                return;
            }

            e.preventDefault();
            navigateWithTransition(targetUrl);
        }

        const categoryItem = e.target.closest('.category-item[data-page]');
        if (categoryItem && !e.target.closest('button')) {
            const page = categoryItem.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                navigateWithTransition(page);
            }
        }
    });

    window.ThaoVyTransitions = {
        navigate: navigateWithTransition,
        setProgress: setProgress,
        finishProgress: finishProgress
    };

})();
