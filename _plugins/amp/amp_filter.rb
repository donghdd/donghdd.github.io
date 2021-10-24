require 'nokogiri'
require 'fastimage'

module Jekyll
  module AmpFilter
    def remove_attribute_toc(input)
      doc = Nokogiri::HTML.fragment(input);

      # remove attributes TOC fo AMP
      doc.css('a').each do |aElm|
        aElm.remove_attribute('spy-title')
        aElm.remove_attribute('spy-toc')
      end

      doc.to_s
    end

    def change_audio_elements(input)
      doc = Nokogiri::HTML.fragment(input);

      # Change 'audio' elements to 'amp-audio'
      doc.css('audio').each do |audio|
        audio.name = "amp-audio"
      end

      doc.to_s
    end

    def amp_insert_domain(input)
      doc = Nokogiri::HTML.fragment(input);
      domain = "https://me.donghd.com"

      # images
      doc.css('img').each do |image|
        if image['src'].start_with?('/')
          image['src'] = domain + image['src']
        end
      end

      # links
      doc.css('a').each do |aElm|
        if aElm['href'].start_with?('/')
          # aElm['href'] = domain + aElm['href']
          aElm.attributes["href"].value = domain + aElm['href']
        end
      end

      doc.to_s
    end

    # Filter for HTML 'img' elements.
    # Converts elements to 'amp-img' and adds additional attributes
    # Parameters:
    #   input       - the content of the post
    #   responsive  - boolean, whether to add layout=responsive, true by default
    def amp_images(input, responsive = true, wi = nil, he = nil)
      doc = Nokogiri::HTML.fragment(input);
      # Add width and height to img elements lacking them
      doc.css('img:not([width])').each do |image|
        if wi && he
          image['width']  = wi
          image['height'] = he
        else
          if image['src'].start_with?('http://', 'https://')
            src = image['src']
          else
            # FastImage doesn't seem to handle local paths when used with Jekyll
            # so let's just force the path
            # src = File.join(Dir.pwd, '_site', image['src'])
            src = File.join(Dir.pwd, image['src'])
          end
          # Jekyll generates static assets after the build process.
          # This causes problems when trying to determine the dimensions of a locally stored image.
          # For now, the only solution is to skip the build and generate the AMP files after the site has beem successfully built.
          # TODO: find a better solution.
          begin
            size = FastImage.size(src)
            image['width']  = size[0]
            image['height'] = size[1]
          rescue Exception => e
            puts 'Unable to get image dimensions for "' + src + '". For local files, build the site with \'--skip-initial-build\' for better results. [Error: ' + e.to_s + ']'
          end
        end

        if ! image['width'] or ! image['height']
          begin
            svg = Nokogiri.parse(File.open(src))
            svgW = svg.xpath("//svg")[0]['width']
            svgH = svg.xpath("//svg")[0]['height']
          rescue Exception => e
              puts 'Something went wrong! src = ' + src + ' error => [' + e.to_s + ']'
          end
          image['width']  = svgW ? svgW : '363px'
          image['height'] = svgH ? svgH : '36px'
        end
      end
      # Change 'img' elements to 'amp-img', add responsive attribute when needed
      doc.css('img').each do |image|
        image.name = "amp-img"
        # remove attribute "onclick"
        image.remove_attribute('onclick')

        image['layout'] = "responsive" if responsive
      end

      # Picture elements are not accepted in amp pages, convert them to amp-img
      #<picture>
      #   <source srcset="mdn-logo-wide.webp" type="image/webp">
      #   <source srcset="mdn-logo-wide.png" media="(min-width: 600px)">
      #   <img src="mdn-logo-narrow.png" alt="MDN">
      #</picture>
      # Move amp-img elements inside picture elements outside of it and remove picture elements
      doc.css('picture').each do |picture|
        # Get img element from picture
        amp_img = picture.css('amp-img')
        picture.add_next_sibling(amp_img) unless amp_img.empty?

        # Remove picture element
        picture.remove
      end

      # Added <img /> tag wrapped with <noscript /> in case js is not enabled
      # but image will still show up. The element would look like this:
      # <amp-img ...>
      #    <noscript>
      #        <img ... />
      #    </noscript>
      # </ampimg ...>
      # Duplicate amp-img, remove layout attribut, wrap it with noscript, and add
      # it as amp-img child
      doc.css('amp-img').each do |amp_img|
        noscript = Nokogiri::XML::Node.new "noscript", doc

        noscript_img = amp_img.dup
        noscript_img.remove_attribute('layout')
        noscript_img.name = 'img'

        noscript.add_child(noscript_img)

        amp_img.add_child(noscript)
      end

      # Return the html as plaintext string
      doc.to_s
    end
  end
end

# Liquid::Template.register_filter(Jekyll::AmpFilter)