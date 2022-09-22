document.addEventListener('DOMContentLoaded', () => {
  let photosArray;
  const templates = {};

  document.querySelectorAll("script[type='text/x-handlebars']").forEach((template) => {
    const templateName = template.id;
    templates[templateName] = Handlebars.compile(template.innerHTML);
  });

  document.querySelectorAll("script[data-type='partial']").forEach((partial) => {
    Handlebars.registerPartial(partial.id, partial.innerHTML);
  });

  const updateData = () => {
    fetch('http://localhost:3000/photos')
      .then((response) => response.json())
      .then((data) => {
        photosArray = data;
      });
  };

  const incrementBtn = (e) => {
    e.preventDefault();
    const btn = e.target;
    const photo_id = e.target.getAttribute('data-id');
    const href = e.target.getAttribute('href');
    const data = { photo_id };
    const json = JSON.stringify(data);

    const postRequest = new XMLHttpRequest();
    postRequest.open('POST', href);
    postRequest.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    postRequest.responseType = 'json';

    postRequest.addEventListener('load', () => {
      const newTotal = String(postRequest.response.total);
      btn.textContent = btn.textContent.replace(/\d+/, newTotal);
    });

    postRequest.send(json);
  };

  const renderPhotos = () => {
    const slides = document.querySelector('#slides');
    const allFigures = templates.photos({ photos: photosArray });
    slides.insertAdjacentHTML('beforeend', allFigures);
  };

  const renderPhotoInformation = (id) => {
    updateData();

    const section = document.querySelector('section');
    const photo = photosArray.filter((image) => image.id === id)[0];
    const photoInfoHTML = templates.photo_information(photo);

    section.querySelectorAll('header').forEach((head) => head.remove());
    section.insertAdjacentHTML('afterbegin', photoInfoHTML);

    const actions = document.querySelector('.actions');
    actions.addEventListener('click', (e) => incrementBtn(e));
  };

  const getCommentsFor = (id) => {
    fetch(`http://localhost:3000/comments?photo_id=${String(id)}`)
      .then((response) => response.json())
      .then((data) => {
        const commentsHTML = templates.photo_comments({ comments: data });
        const commentsList = document.querySelector('#comments > ul');
        commentsList.querySelectorAll('li').forEach((item) => item.remove());
        commentsList.insertAdjacentHTML('beforeend', commentsHTML);
      });
  };

  const slideshow = {
    prevSlide(e) {
      e.preventDefault();
      let prev = this.currentSlide.previousElementSibling;
      if (!prev) {
        prev = this.lastSlide;
      }
      this.fadeOut(this.currentSlide);
      this.fadeIn(prev);
      this.renderPhotoContent(prev.getAttribute('data-id'));
      this.currentSlide = prev;
    },

    nextSlide(e) {
      e.preventDefault();
      let next = this.currentSlide.nextElementSibling;
      if (!next) {
        next = this.firstSlide;
      }
      this.fadeOut(this.currentSlide);
      this.fadeIn(next);
      this.renderPhotoContent(next.getAttribute('data-id'));
      this.currentSlide = next;
    },

    fadeOut(slide) {
      slide.classList.add('hide');
      slide.classList.remove('show');
    },

    fadeIn(slide) {
      slide.classList.remove('hide');
      slide.classList.add('show');
    },

    renderPhotoContent(idx) {
      renderPhotoInformation(Number(idx));
      getCommentsFor(idx);
    },

    addComment(e) {
      e.preventDefault();
      const form = e.currentTarget;
      const path = form.getAttribute('action');
      const method = form.getAttribute('method');
      const photo_id = this.currentSlide.getAttribute('data-id');
      const data = {};

      data.photo_id = photo_id;
      const inputs = form.querySelectorAll('dd > input');
      inputs.forEach((input) => {
        const key = input.getAttribute('name');
        const { value } = input;
        data[key] = value;
      });
      const textArea = form.querySelector('textarea');
      data[textArea.getAttribute('name')] = textArea.value;

      fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(data),
      })
        .then((comments) => comments.json())
        .then((json) => {
          // let html = templates.photo_comment(json);
          getCommentsFor(json.photo_id);
          form.reset();
        });
    },

    bind() {
      const prevButton = this.slideshow.querySelector('a.prev');
      const nextButton = this.slideshow.querySelector('a.next');
      const form = document.querySelector('div > form');
      prevButton.addEventListener('click', (e) => { this.prevSlide(e); });
      nextButton.addEventListener('click', (e) => { this.nextSlide(e); });
      form.addEventListener('submit', (e) => { this.addComment(e); });
    },

    init() {
      this.slideshow = document.querySelector('#slideshow');
      const slides = this.slideshow.querySelectorAll('figure');
      this.firstSlide = slides[0];
      this.lastSlide = slides[slides.length - 1];
      this.currentSlide = this.firstSlide;
      this.bind();
    },
  };

  fetch('http://localhost:3000/photos')
    .then((response) => response.json())
    .then((data) => {
      photosArray = data;
      renderPhotos();
      renderPhotoInformation(photosArray[0].id);
      getCommentsFor(photosArray[0].id);
      slideshow.init();
    });
});
