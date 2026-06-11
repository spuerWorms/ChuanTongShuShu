/**
 * mobile-touch.js - 移动端触摸交互增强模块
 * 提供触摸事件支持、手势操作、弹窗适配等功能
 */
(function() {
    'use strict';

    /* ========================================
     * 移动端检测
     * ======================================== */
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    /* ========================================
     * 日期选择器弹窗移动端适配
     * 修复弹窗定位，支持触摸关闭
     * ======================================== */
    function initDatePickerMobileFix() {
        const popup = document.getElementById('datePickerPopup');
        if (!popup) return;

        // 触摸关闭弹窗（点击遮罩层）
        popup.addEventListener('touchstart', function(e) {
            if (e.target === popup) {
                popup.classList.remove('show');
                // 触发关闭回调
                const picker = window._qimenDatePicker;
                if (picker && picker.stopAutoSync) {
                    picker.stopAutoSync();
                }
            }
        }, { passive: true });

        // 修复移动端弹窗定位（不再使用绝对定位，改用CSS fixed全屏）
        if (isMobile) {
            const origPositionPopup = window.positionPopup;
            if (origPositionPopup) {
                window.positionPopup = function() {
                    // 移动端不设置left/top，由CSS控制全屏居中
                    if (window.innerWidth <= 768) {
                        popup.style.left = '';
                        popup.style.top = '';
                    } else {
                        origPositionPopup();
                    }
                };
            }
        }
    }

    /* ========================================
     * 九宫格触摸交互增强
     * 支持触摸高亮、长按提示
     * ======================================== */
    function initGridTouchInteraction() {
        const grids = document.querySelectorAll('.qimen-grid, .dunjia-grid');

        grids.forEach(grid => {
            // 触摸高亮当前单元格
            grid.addEventListener('touchstart', function(e) {
                const cell = e.target.closest('.qimen-cell, .dunjia-cell');
                if (cell) {
                    cell.style.background = '#f0e8d5';
                    cell.style.transition = 'background 0.1s';
                }
            }, { passive: true });

            grid.addEventListener('touchend', function(e) {
                const cell = e.target.closest('.qimen-cell, .dunjia-cell');
                if (cell) {
                    setTimeout(() => {
                        cell.style.background = '';
                    }, 150);
                }
            }, { passive: true });

            grid.addEventListener('touchcancel', function(e) {
                const cell = e.target.closest('.qimen-cell, .dunjia-cell');
                if (cell) {
                    cell.style.background = '';
                }
            }, { passive: true });
        });
    }

    /* ========================================
     * 按钮触摸防抖（避免快速双击触发两次排盘）
     * ======================================== */
    function initButtonDebounce() {
        const buttons = document.querySelectorAll('#qimenZhuanpanBtn, #qimenFeipanBtn, #chaibuBtn, #zhirunBtn');
        buttons.forEach(btn => {
            let lastTap = 0;
            const originalHandler = btn.onclick;

            btn.addEventListener('touchend', function(e) {
                const now = Date.now();
                if (now - lastTap < 500) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                lastTap = now;
            }, { passive: false });
        });
    }

    /* ========================================
     * 滑动手势支持
     * 在排盘结果区域支持左右滑动切换排盘方式
     * ======================================== */
    function initSwipeGesture() {
        const resultArea = document.querySelector('.container');
        if (!resultArea) return;

        let startX = 0;
        let startY = 0;
        let isSwiping = false;

        resultArea.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });

        resultArea.addEventListener('touchmove', function(e) {
            if (!isSwiping) {
                const dx = Math.abs(e.touches[0].clientX - startX);
                const dy = Math.abs(e.touches[0].clientY - startY);
                // 水平滑动距离大于垂直时标记为横向滑动
                if (dx > dy && dx > 10) {
                    isSwiping = true;
                }
            }
        }, { passive: true });

        resultArea.addEventListener('touchend', function(e) {
            if (!isSwiping) return;

            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            const threshold = 80;

            if (Math.abs(diff) > threshold) {
                const btns = [
                    document.getElementById('qimenZhuanpanBtn'),
                    document.getElementById('qimenFeipanBtn'),
                    document.getElementById('chaibuBtn'),
                    document.getElementById('zhirunBtn')
                ].filter(Boolean);

                if (btns.length === 0) return;

                // 查找当前激活的按钮
                let activeIdx = -1;
                btns.forEach((btn, i) => {
                    if (btn.style.fontWeight === 'bold' || btn.classList.contains('active')) {
                        activeIdx = i;
                    }
                });

                if (diff > 0 && activeIdx > 0) {
                    // 右滑 → 上一个
                    btns[activeIdx - 1].click();
                } else if (diff < 0 && activeIdx < btns.length - 1) {
                    // 左滑 → 下一个
                    btns[activeIdx + 1].click();
                }
            }

            isSwiping = false;
        }, { passive: true });
    }

    /* ========================================
     * 阻止iOS橡皮筋效果（仅在弹窗打开时）
     * ======================================== */
    function initPreventOverscroll() {
        const popup = document.getElementById('datePickerPopup');
        if (!popup) return;

        popup.addEventListener('touchmove', function(e) {
            const box = popup.querySelector('.qdp-popup-box');
            if (box && box.contains(e.target)) {
                // 弹窗内容区域内允许滚动
                return;
            }
            // 遮罩层阻止滚动
            e.preventDefault();
        }, { passive: false });
    }

    /* ========================================
     * 移动端键盘弹出时调整布局
     * ======================================== */
    function initViewportResizeFix() {
        if (!isMobile) return;

        let initialHeight = window.innerHeight;

        window.addEventListener('resize', function() {
            const currentHeight = window.innerHeight;
            // 键盘弹出时高度变化超过150px
            if (initialHeight - currentHeight > 150) {
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
            }
        });
    }

    /* ========================================
     * 双指缩放九宫格支持
     * ======================================== */
    function initPinchZoom() {
        const grids = document.querySelectorAll('.qimen-grid, .dunjia-grid');
        grids.forEach(grid => {
            let initialDistance = 0;
            let currentScale = 1;

            grid.addEventListener('touchstart', function(e) {
                if (e.touches.length === 2) {
                    initialDistance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                }
            }, { passive: true });

            grid.addEventListener('touchmove', function(e) {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const distance = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    const scale = distance / initialDistance;
                    currentScale = Math.min(Math.max(scale, 0.8), 2.0);
                    grid.style.transform = `scale(${currentScale})`;
                    grid.style.transformOrigin = 'center center';
                }
            }, { passive: false });

            grid.addEventListener('touchend', function(e) {
                if (e.touches.length < 2) {
                    // 缓慢恢复原始大小
                    grid.style.transition = 'transform 0.3s ease';
                    grid.style.transform = 'scale(1)';
                    setTimeout(() => {
                        grid.style.transition = '';
                    }, 300);
                }
            }, { passive: true });
        });
    }

    /* ========================================
     * 移动端mousedown事件转touch事件适配
     * 修复日期选择器弹窗在移动端的关闭逻辑
     * ======================================== */
    function initTouchCloseAdapter() {
        // 替换原有的 mousedown 关闭逻辑为 touchstart
        document.addEventListener('touchstart', function(e) {
            const popup = document.getElementById('datePickerPopup');
            const customTimeInput = document.getElementById('customTime');
            const calendarIcon = document.getElementById('calendarIcon');

            if (popup && popup.classList.contains('show') &&
                !popup.contains(e.target) &&
                e.target !== customTimeInput &&
                !calendarIcon?.contains(e.target)) {
                popup.classList.remove('show');
                const picker = window._qimenDatePicker;
                if (picker && picker.stopAutoSync) {
                    picker.stopAutoSync();
                }
            }
        }, { passive: true });
    }

    /* ========================================
     * 初始化所有移动端交互功能
     * ======================================== */
    function init() {
        initDatePickerMobileFix();
        initGridTouchInteraction();
        initButtonDebounce();
        initSwipeGesture();
        initPreventOverscroll();
        initViewportResizeFix();
        initPinchZoom();
        initTouchCloseAdapter();
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 排盘结果渲染后重新绑定九宫格触摸交互
    const origRenderQimen = window.renderQimenChart;
    const origRenderDunjia = window.renderDunjiaResult;

    if (origRenderQimen) {
        window.renderQimenChart = function(data) {
            origRenderQimen(data);
            setTimeout(initGridTouchInteraction, 100);
            setTimeout(initPinchZoom, 100);
        };
    }

    if (origRenderDunjia) {
        window.renderDunjiaResult = function(data) {
            origRenderDunjia(data);
            setTimeout(initGridTouchInteraction, 100);
            setTimeout(initPinchZoom, 100);
        };
    }
})();
