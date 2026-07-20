/**
 * 公告模块 - 负责 announcement.html 页面的列表渲染、分类筛选与详情查看
 * 依赖：layui（laytpl / layer / laypage）、announcementData.js
 */
layui.define(['jquery', 'laytpl', 'layer', 'laypage', 'element'], function (exports) {
  var $ = layui.jquery;
  var laytpl = layui.laytpl;
  var layer = layui.layer;
  var laypage = layui.laypage;
  var element = layui.element;

  // 原始数据
  var rawData = (window.ANNOUNCEMENT_DATA || []).slice();

  // 分类颜色映射
  var categoryColor = {
    '公司动态': '#2db5a3',
    '产品发布': '#1E9FFF',
    '网络安全': '#FF5722',
    '校企合作': '#FFB800',
    '技术升级': '#16BAAA',
    '节假日通知': '#FF7800',
    '行业活动': '#A23300',
    '采购公示': '#7C4DFF'
  };

  // 当前状态
  var state = {
    category: '全部',
    page: 1,
    limit: 8
  };

  // 列表项模板
  var itemTpl = [
    '<div class="ann-item {{# if(d.important){ }}important{{# } }}">',
    '  <div class="ann-date">',
    '    <span class="day">{{d.day}}</span>',
    '    <span class="month">{{d.month}}</span>',
    '  </div>',
    '  <div class="ann-body">',
    '    <div class="ann-head">',
    '      {{# if(d.important){ }}<span class="ann-pin">置顶</span>{{# } }}',
    '      <span class="ann-tag" style="background:{{d.catColor}};">{{d.category}}</span>',
    '      <h3 class="ann-title" data-id="{{d.id}}">{{d.title}}</h3>',
    '    </div>',
    '    <p class="ann-desc">{{d.summary}}</p>',
    '    <div class="ann-foot">',
    '      <span class="ann-full-date">{{d.date}}</span>',
    '      <a class="ann-more" data-id="{{d.id}}">查看详情 &gt;</a>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  // 详情模板
  var detailTpl = [
    '<div class="ann-detail">',
    '  <h2>{{d.title}}</h2>',
    '  <div class="ann-detail-meta">',
    '    <span class="ann-tag" style="background:{{d.catColor}};">{{d.category}}</span>',
    '    <span>发布日期：{{d.date}}</span>',
    '  </div>',
    '  <div class="ann-detail-content">{{d.content}}</div>',
    '  {{# if(d.important){ }}<div class="ann-detail-pin">※ 此公告为重要公告</div>{{# } }}',
    '</div>'
  ].join('');

  // 工具：根据中文日期格式化
  function formatDate(dateStr) {
    // dateStr: 'YYYY-MM-DD'
    var parts = (dateStr || '').split('-');
    return {
      year: parts[0] || '',
      month: (parts[1] || '') + '月',
      day: parts[2] || ''
    };
  }

  // 工具：生成摘要
  function makeSummary(content) {
    var txt = (content || '').replace(/\s+/g, ' ').trim();
    return txt.length > 80 ? txt.substring(0, 80) + '…' : txt;
  }

  // 工具：获取过滤后的数据
  function getFiltered() {
    if (state.category === '全部') return rawData;
    return rawData.filter(function (item) {
      return item.category === state.category;
    });
  }

  // 渲染分类筛选条
  function renderCategories() {
    var cats = ['全部'];
    rawData.forEach(function (item) {
      if (cats.indexOf(item.category) === -1) cats.push(item.category);
    });
    var html = '';
    cats.forEach(function (cat) {
      var active = (cat === state.category) ? 'active' : '';
      var color = cat === '全部' ? '#2db5a3' : (categoryColor[cat] || '#999');
      html += '<li class="' + active + '" data-cat="' + cat + '" style="border-color:' + (active ? color : '#e2e2e2') + ';color:' + (active ? color : '#b5b5b5') + ';">' + cat + '</li>';
    });
    $('#annCats').html(html);
  }

  // 渲染列表
  function renderList() {
    var filtered = getFiltered();
    var count = filtered.length;
    var start = (state.page - 1) * state.limit;
    var end = start + state.limit;
    var pageData = filtered.slice(start, end);

    var html = '';
    pageData.forEach(function (item) {
      var dt = formatDate(item.date);
      var data = {
        id: item.id,
        title: item.title,
        category: item.category,
        catColor: categoryColor[item.category] || '#999',
        date: item.date,
        day: dt.day,
        month: dt.month,
        summary: makeSummary(item.content),
        important: !!item.important
      };
      html += laytpl(itemTpl).render(data);
    });

    if (!html) {
      html = '<div class="ann-empty">暂无该分类下的公告</div>';
    }
    $('#annList').html(html);

    // 分页
    laypage.render({
      elem: 'annPage',
      count: count,
      curr: state.page,
      limit: state.limit,
      theme: '#2db5a3',
      layout: ['prev', 'page', 'next', 'count', 'skip'],
      jump: function (obj, first) {
        if (!first) {
          state.page = obj.curr;
          renderList();
          // 滚动到列表顶部
          $('html, body').animate({ scrollTop: $('.main-announcement').offset().top - 90 }, 300);
        }
      }
    });
  }

  // 查看详情
  function showDetail(id) {
    var item = rawData.filter(function (d) { return d.id == id; })[0];
    if (!item) return;
    var data = {
      title: item.title,
      category: item.category,
      catColor: categoryColor[item.category] || '#999',
      date: item.date,
      content: item.content,
      important: !!item.important
    };
    var html = laytpl(detailTpl).render(data);
    layer.open({
      type: 1,
      title: '公告详情',
      area: ['640px', '80%'],
      maxmin: false,
      shadeClose: true,
      content: html
    });
  }

  // 事件绑定
  function bindEvents() {
    // 分类切换
    $('#annCats').on('click', 'li', function () {
      var cat = $(this).attr('data-cat');
      if (cat === state.category) return;
      state.category = cat;
      state.page = 1;
      renderCategories();
      renderList();
    });

    // 点击标题或查看详情
    $('#annList').on('click', '.ann-title, .ann-more', function (e) {
      e.preventDefault();
      var id = $(this).attr('data-id');
      showDetail(id);
    });
  }

  // 初始化
  function init() {
    renderCategories();
    renderList();
    bindEvents();
  }

  exports('announcement', { init: init });
});
