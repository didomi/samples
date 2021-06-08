

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



function setPositiveConsentStatusForVendor(vendorId) {

// Get all the vendor purposes
  var purposes = Didomi.getVendorById(vendorId).purposeIds;

// Create a "transaction"...
  var transaction = Didomi.openTransaction();

// ... enable the vendor
  transaction.enableVendor(vendorId);

// ... and all his purposes
  transaction.enablePurposes(...purposes);

// send the new status using "commit"
  transaction.commit();

}


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
