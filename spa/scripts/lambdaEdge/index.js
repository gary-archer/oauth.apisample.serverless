/* LINKS
   https://aws.amazon.com/blogs/compute/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-lambdaedge/
   https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-examples.html
   Does my lambda have permissions to execute - look further into policy
*/

/*
 * A redirect lambda deployed to Lambda Edge to manage CloudFront redirects
 */
exports.handler = async (event) => {

    // Extract the request from the CloudFront event that is sent to Lambda@Edge 
    var request = event.Records[0].cf.request;

    // Extract the URI from the request
    var olduri = request.uri;
    console.log("Old URI: " + olduri);

    // Match any '/' that occurs at the end of a URI. Replace it with a default index
    var newuri = olduri.replace(/\/$/, '\/index.html');
    console.log("New URI: " + newuri);
    
    // Replace the received URI with the URI that includes the index page
    request.uri = newuri;
    
    // Return to CloudFront
    return request;
};

/*
 * Current deployed version
 */
exports.handler = async (event) => {
    
    console.log("LAMBDA EDGE START");
    const request = event.Records[0].cf.request;
    
    try {
        
        // Extract the URI from the request
        var olduri = request.uri;
        console.log("Request URI: " + olduri);
    
        // Match any '/' that occurs at the end of a URI. Replace it with a default index
        var newuri = olduri.replace(/\/$/, '\/index.html');
        console.log("Updated URI: " + newuri);
        
        // Replace the received URI with the URI that includes the index page
        // request.uri = newuri;
    }
    catch(e) {
        console.log('LAMBDA EDGE ERROR');
        console.log(e);
    }
    
    // Return to CloudFront
    return request;
};
