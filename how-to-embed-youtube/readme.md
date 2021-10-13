# How to condition a third party Video on your website.

When it comes to embedding an external video on your website, because third party video vendors will have access to the visitors personal data, it is often required to receive the visitor's consent before launching the video.


There are many ways to achieve this with Didomi web SDK.  
In the following example, we will describe one solution to do so, using a video from Youtube as an example and without using a CMS.


## What we do

1- We will prevent the video to be launched if the visitor has not given consent.

2- We will add an overlay with a "I agree" button above the videos to collect the visitor consent  



## How it works

Videos from youtube can be embedded through an <iframe> element.  
This element has a src attribute which value is the video URL.   




#### => as soon as this element is loaded in the page, the `src`attribute will load the vendor (Youtube) and personal data will potentially be processed.

In order to respect user privacy, you have to block the moment the video is loaded until the visitor has given his consent to Youtube.

## Prerequisite

You need to make sure the video vendor is actually declared in your consent notice.

Let's start !


## Step 1 : Blocking the video source

In your `html` file, a Youtube embedded video should looks like this :
```html
<html>
  <head>

    <!-- [...] -->

  </head>
  <body>

    <!-- [...] -->

    <iframe
    width="560"
    height="315"
    src="video_source_goes_here"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
    </iframe>

    <!-- [...] -->

  </body>
</html>
```

The `src` must be replaced with a `data-src` attribute:

```html
<iframe
  ...
  data-src="video_source_goes_here"
  ...
>
</iframe>
```

## Step 2: Setting up the overlay (HTML)

The following steps will require to add an overlay with an "I agree" button to allow the visitor to give his consent.

It's more convenient to add a html parent tag to encompass all the new elements we have to add.


```html
<!-- Parent tag ".youtube-container" to encompass everything -->
<div class="youtube-container">

  <!-- Youtube video with "data-src" -->
  <iframe
  width="560"
  height="315"
  data-src="video_source_goes_here"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
  </iframe>

</div>
```

Inside our parent tag, we also add a text message with a button element:
note: As it needs to comply with the regulation, your custom text must to be validated by your legal department.


```html
<!-- Parent tag ".youtube-container" to encompass everything -->
<div class="youtube-container">

  <!-- Youtube video with "data-src" -->
  <iframe
  width="560"
  height="315"
  data-src="video_source_goes_here"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
  </iframe>

  <!-- Message & "I accept" button -->
  <div class="video-consent-overlay">
    <div class="video-consent-overlay-text">
      Viewing this video may result in cookies being placed by the vendor of the video platform to which you will be directed.
      Given the refusal of the deposit of cookies that you have expressed, in order to respect your choice, we have blocked the playback of this video.
      If you want to continue and play the video, you must give us your consent by clicking on the button below.</div>
    <div class="video-consent-overlay-accept-button">I accept - Launch the video</div>
  </div>

</div>
```

## Step 3: Setting up the overlay (CSS)

Now we have to arrange the layout so the video overlay (`video-consent-overlay`) appears above the video.  
We also have to add style to make our text & button a bit more fancies.
There are a lot of differents ways to do so, here is one suggestion:

```css
.youtube-container{
  position: relative;
}
.youtube-container > iframe{
  display:block;
}

.youtube-container > .video-consent-overlay{
  position:absolute;
  top:0;
  left:0;
  width: 100%;
  height: 100%;
  background-color: black;
  display:flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing:border-box;
  padding:0 20px;
  color: white;
}
.youtube-container .video-consent-overlay-text{
  text-align:center;
}
.youtube-container .video-consent-overlay-accept-button{
  margin: 20px 0 0 0;
  padding: 8px 10px;
  background-color: blue;
  cursor:pointer;
}
```

## Step 4: Interactions (Javascript)

Now that everything is in place, we need to add our logic that will trigger the video launch.

First, we will need several custom functions:

### a) Play the video and hide the overlay
This function will take the overlay element `.youtube-container` as a parameter:

```javascript
function playVideoAndHideOverlay(overlay) {

  // Get the youtube iframe with a 'data-src' attribute
  var iframe = overlay.querySelector('iframe[data-src]');

  // Get the 'data-src' value
  var src = iframe.getAttribute('data-src');

  // Set the 'data-src' value to the 'src' attribute
  iframe.setAttribute('src', src);

  // Hide the overlay
  overlay.querySelector('.video-consent-overlay').style.display = 'none';
}
```

### b) Send a positive vendor & purposes consent status
Given one specific vendor ID, it will update the status with a positive consent signal.

```javascript

function setPositiveConsentStatusForVendor(vendorId) {

  // Get all the vendor purposes
  var purposes = Didomi.getVendorById(vendorId).purposeIds;

  // Create a "transaction"...
  var transaction = Didomi.openTransaction();

  // ... enable the vendor
  transaction.enableVendor(vendorId);

  // ... and all his purposes
  transaction.enablePurposes(...purposes);

  // update the new status using "commit"
  transaction.commit();

}
```

c) Integrates with Didomi's SDK

```javascript
// Create the "didomiOnReady" listener
window.didomiOnReady = window.didomiOnReady || [];
window.didomiOnReady.push(function (Didomi) {

  // Subscribe to the vendor status : It triggers the listener each time the status is changed for this vendor.
  Didomi.getObservableOnUserConsentStatusForVendor('c:youtube')
  .subscribe(function (consentStatus) {

    // Check if the "consentStatus" is true (eg. the user agreed to the vendor & his purposes)
    if (consentStatus === true) {

      // Loop into all the ".youtube-container" (even if we only have one in the example)
      document.querySelectorAll('.youtube-container').forEach(function(video) {

        // call our play & hide function
        playVideoAndHideOverlay(video);

      })

    }

  })

  // An event listener is attached to each button element
  document.querySelectorAll('.video-consent-overlay-accept-button').forEach(function(button) {
    button.addEventListener('click', function() {

      // When the button is clicked, we call the setPositiveConsentStatusForVendor custom function to enable the vendor (Youtube) and all his purposes.
      setPositiveConsentStatusForVendor('c:youtube');

    })
  })

});
```
