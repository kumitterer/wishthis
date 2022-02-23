<?php

/**
 * cache.php
 *
 * Cache embed requests.
 *
 * @author Jay Trees <github.jay@grandel.anonaddy.me>
 */

namespace wishthis;

class EmbedCache
{
    private $directory = ROOT . '/src/cache';

    public function __construct()
    {
    }

    public function get(string $url): mixed
    {
        $info       = null;
        $identifier = md5($url);
        $filepath   = $this->directory . '/' . $identifier;
        $maxAge     = 2592000; // 30 days
        $age        = file_exists($filepath) ? time() - filemtime($filepath) : $maxAge;

        if (file_exists($filepath) && $age <= $maxAge) {
            $info = json_decode(file_get_contents($filepath));
        } else {
            /**
             * @link https://github.com/oscarotero/Embed
             */
            $embed = new \Embed\Embed();

            $info_simplified = new \stdClass();
            $info_simplified->authorName    = '';
            $info_simplified->authorUrl     = '';
            $info_simplified->cms           = '';
            $info_simplified->code          = '';
            $info_simplified->description   = '';
            $info_simplified->favicon       = '';
            $info_simplified->feeds         = array();
            $info_simplified->icon          = '';
            $info_simplified->image         = '';
            $info_simplified->keywords      = array();
            $info_simplified->language      = '';
            $info_simplified->languages     = array();
            $info_simplified->license       = '';
            $info_simplified->providerName  = '';
            $info_simplified->providerUrl   = '';
            $info_simplified->publishedTime = '';
            $info_simplified->redirect      = '';
            $info_simplified->title         = $url;
            $info_simplified->url           = $url;

            /*
            try {
                $info = $embed->get($url);

                $info_simplified->authorName    = (string) $info->authorName;
                $info_simplified->authorUrl     = (string) $info->authorUrl;
                $info_simplified->cms           = (string) $info->cms;
                $info_simplified->code          = (string) $info->code;
                $info_simplified->description   = (string) $info->description;
                $info_simplified->favicon       = (string) $info->favicon;
                $info_simplified->feeds         = (array)  $info->feeds;
                $info_simplified->icon          = (string) $info->icon;
                $info_simplified->image         = (string) $info->image;
                $info_simplified->keywords      = (array)  $info->keywords;
                $info_simplified->language      = (string) $info->language;
                $info_simplified->languages     = (array)  $info->languages;
                $info_simplified->license       = (string) $info->license;
                $info_simplified->providerName  = (string) $info->providerName;
                $info_simplified->providerUrl   = (string) $info->providerUrl;
                $info_simplified->publishedTime = $info->publishedTime ? $info->publishedTime->format('d.m.Y') : '';
                $info_simplified->redirect      = (string) $info->redirect;
                $info_simplified->title         = (string) $info->title;
                $info_simplified->url           = (string) $info->url;
            } catch (\Throwable $ex) {
                $info_simplified->title = $ex->getMessage();
            }
            */

            $info = $info_simplified;

            // file_put_contents($filepath, json_encode($info));
        }

        return $info;
    }
}