"""
Paper Metadata Fetcher Service
Fetches paper descriptions and authors from URLs when they're missing
"""

import logging
import httpx
import re
from typing import Dict, Optional, Tuple
from bs4 import BeautifulSoup
import asyncio

logger = logging.getLogger(__name__)


class PaperMetadataFetcher:
    """Service to fetch paper metadata (authors, descriptions) from URLs"""
    
    def __init__(self):
        """Initialize the fetcher with HTTP client"""
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=10.0, read=30.0),
            follow_redirects=True
        )
    
    async def fetch_metadata(self, url: str, title: str = "") -> Dict[str, Optional[str]]:
        """
        Fetch paper metadata (authors, description, DOI, PMID) from a URL.
        
        Args:
            url: URL to the paper
            title: Paper title (for context)
        
        Returns:
            Dictionary with 'authors', 'description', 'doi', and 'pmid' fields
        """
        if not url or url == 'N/A':
            return {'authors': None, 'description': None, 'doi': None, 'pmid': None}
        
        try:
            # Check if it's a PubMed URL
            if 'pubmed.ncbi.nlm.nih.gov' in url or 'ncbi.nlm.nih.gov/pubmed' in url:
                return await self._fetch_pubmed_metadata(url)
            
            # Check if it's an NCBI books URL
            if 'ncbi.nlm.nih.gov/books' in url:
                return await self._fetch_ncbi_books_metadata(url)
            
            # Check if it's a PMC URL
            if 'ncbi.nlm.nih.gov/pmc' in url or 'pmc/articles' in url:
                return await self._fetch_pmc_metadata(url)
            
            # Check if it's a DOI URL
            if 'doi.org' in url or '/10.' in url:
                return await self._fetch_doi_metadata(url)
            
            # Generic web scraping fallback
            return await self._fetch_generic_metadata(url, title)
            
        except Exception as e:
            logger.warning(f"Error fetching metadata from {url}: {e}")
            return {'authors': None, 'description': None, 'doi': None, 'pmid': None}
    
    async def _fetch_pubmed_metadata(self, url: str) -> Dict[str, Optional[str]]:
        """Fetch metadata from PubMed URL"""
        try:
            # Extract PMID from URL
            pmid_match = re.search(r'/(\d+)/?$', url)
            if not pmid_match:
                return {'authors': None, 'description': None}
            
            pmid = pmid_match.group(1)
            
            # Use PubMed API to fetch metadata
            api_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            params = {
                "db": "pubmed",
                "id": pmid,
                "retmode": "xml",
                "rettype": "abstract"
            }
            
            response = await self.client.get(api_url, params=params)
            response.raise_for_status()
            
            # Parse XML
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.text)
            
            # Extract authors
            authors = []
            for author in root.findall(".//Author"):
                last_name = author.find("LastName")
                first_name = author.find("ForeName")
                if last_name is not None:
                    author_name = last_name.text
                    if first_name is not None:
                        author_name += f" {first_name.text}"
                    authors.append(author_name)
            
            authors_str = ", ".join(authors[:5])
            if len(authors) > 5:
                authors_str += " et al."
            
            # Extract abstract/description
            abstract_elem = root.find(".//AbstractText")
            description = abstract_elem.text if abstract_elem is not None else None
            
            # Extract DOI
            doi_elem = root.find(".//ELocationID[@EIdType='doi']")
            doi = doi_elem.text if doi_elem is not None else None
            
            # PMID is already known from URL
            pmid = pmid_match.group(1) if pmid_match else None
            
            return {
                'authors': authors_str if authors_str else None,
                'description': description,
                'doi': doi,
                'pmid': pmid
            }
            
        except Exception as e:
            logger.warning(f"Error fetching PubMed metadata: {e}")
            return {'authors': None, 'description': None, 'doi': None, 'pmid': None}
    
    async def _fetch_ncbi_books_metadata(self, url: str) -> Dict[str, Optional[str]]:
        """Fetch metadata from NCBI Books URL"""
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            
            text = response.text
            
            if not BEAUTIFULSOUP_AVAILABLE:
                # Fallback: try to extract from text using regex - be more aggressive
                authors = None
                author_patterns = [
                    r'Author[s]?[:\s]+([^\n<]+)',
                    r'<meta[^>]*name=["\']citation_author["\'][^>]*content=["\']([^"\']+)["\']',
                ]
                for pattern in author_patterns:
                    author_match = re.search(pattern, text, re.I)
                    if author_match:
                        authors = author_match.group(1).strip()
                        break
                
                # Look for description/abstract - be more aggressive
                description = None
                desc_patterns = [
                    r'(?:Abstract|Summary|Description|Overview)[:\s]+([^\n<]{150,800})',
                    r'<div[^>]*class=["\'][^"\']*(?:abstract|summary|description)[^"\']*["\'][^>]*>([^<]{150,800})</div>',
                ]
                for pattern in desc_patterns:
                    desc_match = re.search(pattern, text, re.I | re.DOTALL)
                    if desc_match:
                        description = desc_match.group(1).strip()
                        description = re.sub(r'<[^>]+>', ' ', description)
                        description = re.sub(r'\s+', ' ', description).strip()
                        if len(description) > 500:
                            description = description[:500] + "..."
                        break
                
                # If still no description, get first substantial paragraph
                if not description:
                    para_match = re.search(r'<p[^>]*>([^<]{200,800})</p>', text, re.I | re.DOTALL)
                    if para_match:
                        description = para_match.group(1).strip()
                        description = re.sub(r'<[^>]+>', ' ', description)
                        description = re.sub(r'\s+', ' ', description).strip()
                        if len(description) > 500:
                            description = description[:500] + "..."
                
                return {'authors': authors, 'description': description}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try to find authors - be more aggressive
            authors = None
            author_selectors = [
                ('meta', {'name': 'citation_author'}),
                ('meta', {'name': re.compile('author', re.I)}),
                ('span', {'class': re.compile('author', re.I)}),
                ('div', {'class': re.compile('author', re.I)}),
            ]
            
            for tag, attrs in author_selectors:
                author_elem = soup.find(tag, attrs)
                if author_elem:
                    authors = author_elem.get('content') or author_elem.get_text(strip=True)
                    if authors:
                        break
            
            # Try to find description/abstract - be very aggressive
            description = None
            desc_selectors = [
                'div.abstract', 'section.abstract', 'div.summary', 'section.summary',
                'div.description', 'section.description', 'article.abstract',
                '[class*="abstract"]', '[class*="summary"]', '[class*="description"]',
            ]
            
            for selector in desc_selectors:
                try:
                    desc_elem = soup.select_one(selector)
                    if desc_elem:
                        description = desc_elem.get_text(strip=True)
                        if description and len(description) > 100:
                            if len(description) > 500:
                                description = description[:500] + "..."
                            break
                except:
                    continue
            
            # If no description found, get first few substantial paragraphs
            if not description:
                paragraphs = soup.find_all('p')
                para_texts = []
                for p in paragraphs[:5]:
                    text = p.get_text(strip=True)
                    if text and len(text) > 100:
                        para_texts.append(text)
                        if len(' '.join(para_texts)) > 300:
                            break
                
                if para_texts:
                    description = ' '.join(para_texts)
                    if len(description) > 500:
                        description = description[:500] + "..."
            
            # Try to extract DOI/PMID from URL or page
            doi = None
            pmid = None
            
            # Check URL for DOI
            doi_match = re.search(r'10\.\d+/[^\s/]+', url)
            if doi_match:
                doi = doi_match.group(0)
            
            # Try to find DOI/PMID in page content
            if not doi:
                doi_elem = soup.find('meta', {'name': re.compile('citation_doi|doi', re.I)})
                if doi_elem:
                    doi = doi_elem.get('content', '')
            
            if not pmid:
                pmid_elem = soup.find('meta', {'name': re.compile('citation_pmid|pmid', re.I)})
                if pmid_elem:
                    pmid = pmid_elem.get('content', '')
            
            return {
                'authors': authors,
                'description': description,
                'doi': doi,
                'pmid': pmid
            }
            
        except Exception as e:
            logger.warning(f"Error fetching NCBI Books metadata: {e}")
            return {'authors': None, 'description': None, 'doi': None, 'pmid': None}
    
    async def _fetch_pmc_metadata(self, url: str) -> Dict[str, Optional[str]]:
        """Fetch metadata from PMC URL"""
        try:
            # Extract PMC ID
            pmc_match = re.search(r'PMC(\d+)', url)
            if pmc_match:
                pmc_id = pmc_match.group(1)
                # Use PMC API
                api_url = f"https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi"
                params = {"id": f"PMC{pmc_id}"}
                # This is a simplified approach - PMC API is more complex
                # For now, fall back to web scraping
                pass
            
            # Web scraping fallback
            response = await self.client.get(url)
            response.raise_for_status()
            
            if not BEAUTIFULSOUP_AVAILABLE:
                return {'authors': None, 'description': None}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract authors
            authors = None
            author_meta = soup.find_all('meta', {'name': 'citation_author'})
            if author_meta:
                author_list = [meta.get('content', '') for meta in author_meta]
                authors = ", ".join(author_list[:5])
                if len(author_list) > 5:
                    authors += " et al."
            
            # Extract abstract
            description = None
            abstract_elem = soup.find('div', class_=re.compile('abstract', re.I)) or \
                          soup.find('section', class_=re.compile('abstract', re.I))
            
            if abstract_elem:
                description = abstract_elem.get_text(strip=True)
                if len(description) > 500:
                    description = description[:500] + "..."
            
            # Extract DOI/PMID
            doi = None
            pmid = None
            
            # Check URL for PMID
            if pmc_match:
                pmc_id = pmc_match.group(1)
                # Try to get PMID from PMC API or page
                pmid_elem = soup.find('meta', {'name': re.compile('citation_pmid|pmid', re.I)})
                if pmid_elem:
                    pmid = pmid_elem.get('content', '')
            
            # Check for DOI
            doi_elem = soup.find('meta', {'name': re.compile('citation_doi|doi', re.I)})
            if doi_elem:
                doi = doi_elem.get('content', '')
            
            return {
                'authors': authors,
                'description': description,
                'doi': doi,
                'pmid': pmid
            }
            
        except Exception as e:
            logger.warning(f"Error fetching PMC metadata: {e}")
            return {'authors': None, 'description': None, 'doi': None, 'pmid': None}
    
    async def _fetch_doi_metadata(self, url: str) -> Dict[str, Optional[str]]:
        """Fetch metadata from DOI URL"""
        try:
            # Extract DOI
            doi_match = re.search(r'10\.\d+/[^\s/]+', url)
            if not doi_match:
                return {'authors': None, 'description': None}
            
            doi = doi_match.group(0)
            
            # Use CrossRef API (free, no API key required)
            crossref_url = f"https://api.crossref.org/works/{doi}"
            response = await self.client.get(crossref_url)
            
            if response.status_code == 200:
                data = response.json()
                work = data.get('message', {})
                
                # Extract authors
                authors = None
                author_list = work.get('author', [])
                if author_list:
                    author_names = []
                    for author in author_list[:5]:
                        given = author.get('given', '')
                        family = author.get('family', '')
                        if family:
                            name = f"{family}, {given}".strip(', ')
                            author_names.append(name)
                    authors = ", ".join(author_names)
                    if len(author_list) > 5:
                        authors += " et al."
                
                # Extract abstract
                description = None
                if 'abstract' in work:
                    description = work['abstract']
                elif 'description' in work:
                    description = work['description']
                
                # DOI is already known
                # Try to get PMID from CrossRef (if available)
                pmid = None
                # CrossRef doesn't directly provide PMID, but we can try alternative identifiers
                
                return {
                    'authors': authors,
                    'description': description,
                    'doi': doi,
                    'pmid': pmid
                }
            
            # Fallback to web scraping
            return await self._fetch_generic_metadata(url, "")
            
        except Exception as e:
            logger.warning(f"Error fetching DOI metadata: {e}")
            return {'authors': None, 'description': None}
    
    async def _fetch_generic_metadata(self, url: str, title: str = "") -> Dict[str, Optional[str]]:
        """Generic web scraping fallback"""
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            
            if not BEAUTIFULSOUP_AVAILABLE:
                # Basic text extraction without BeautifulSoup
                text = response.text
                authors = None
                desc = None
                
                # Try to find authors in meta tags
                author_meta = re.search(r'<meta[^>]*name=["\'](?:author|citation_author)["\'][^>]*content=["\']([^"\']+)["\']', text, re.I)
                if author_meta:
                    authors = author_meta.group(1)
                
                # Try to find description
                desc_match = re.search(r'<meta[^>]*name=["\'](?:description|abstract)["\'][^>]*content=["\']([^"\']+)["\']', text, re.I)
                if desc_match:
                    desc = desc_match.group(1)
                
                # Try to extract DOI/PMID from meta tags
                doi = None
                pmid = None
                doi_meta = re.search(r'<meta[^>]*name=["\'](?:citation_doi|doi)["\'][^>]*content=["\']([^"\']+)["\']', text, re.I)
                if doi_meta:
                    doi = doi_meta.group(1)
                pmid_meta = re.search(r'<meta[^>]*name=["\'](?:citation_pmid|pmid)["\'][^>]*content=["\']([^"\']+)["\']', text, re.I)
                if pmid_meta:
                    pmid = pmid_meta.group(1)
                
                return {'authors': authors, 'description': desc, 'doi': doi, 'pmid': pmid}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try to find authors using common patterns
            authors = None
            # Look for citation meta tags
            author_meta = soup.find_all('meta', {'name': re.compile('author|citation_author', re.I)})
            if author_meta:
                author_list = [meta.get('content', '') for meta in author_meta if meta.get('content')]
                if author_list:
                    authors = ", ".join(author_list[:5])
                    if len(author_list) > 5:
                        authors += " et al."
            
            # Try to find description/abstract
            description = None
            # Look for common abstract/description selectors
            desc_selectors = [
                'div.abstract', 'section.abstract', 'div.summary', 'section.summary',
                'div.description', 'section.description', 'article.abstract',
                '[class*="abstract"]', '[class*="summary"]', '[class*="description"]'
            ]
            
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text(strip=True)
                    if len(description) > 500:
                        description = description[:500] + "..."
                    break
            
            # If still no description, get first few paragraphs
            if not description:
                paragraphs = soup.find_all('p')
                if paragraphs:
                    description = ' '.join([p.get_text(strip=True) for p in paragraphs[:3] if p.get_text(strip=True)])
                    if len(description) > 500:
                        description = description[:500] + "..."
            
            # Try to extract DOI/PMID
            doi = None
            pmid = None
            
            # Look for DOI/PMID in meta tags
            doi_elem = soup.find('meta', {'name': re.compile('citation_doi|doi', re.I)})
            if doi_elem:
                doi = doi_elem.get('content', '')
            
            pmid_elem = soup.find('meta', {'name': re.compile('citation_pmid|pmid', re.I)})
            if pmid_elem:
                pmid = pmid_elem.get('content', '')
            
            # Also check URL for DOI
            if not doi:
                doi_match = re.search(r'10\.\d+/[^\s/]+', url)
                if doi_match:
                    doi = doi_match.group(0)
            
            return {
                'authors': authors,
                'description': description,
                'doi': doi,
                'pmid': pmid
            }
            
        except Exception as e:
            logger.warning(f"Error in generic metadata fetch: {e}")
            return {'authors': None, 'description': None, 'doi': None, 'pmid': None}
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


async def fetch_paper_metadata_batch(papers: list, max_concurrent: int = 5) -> list:
    """
    Fetch metadata for multiple papers concurrently.
    
    Args:
        papers: List of paper dictionaries with 'link' and 'title' fields
        max_concurrent: Maximum number of concurrent requests
    
    Returns:
        List of papers with updated 'authors' and 'description' fields
    """
    fetcher = PaperMetadataFetcher()
    
    async def fetch_one(paper):
        """Fetch metadata for one paper"""
        if not paper.get('link') or paper.get('link') == 'N/A':
            return paper
        
        # Skip if we already have both authors and description
        if paper.get('authors') and paper.get('authors') != 'N/A' and \
           paper.get('description') and paper.get('description') != 'N/A':
            return paper
        
        try:
            metadata = await fetcher.fetch_metadata(paper.get('link', ''), paper.get('title', ''))
            
            # Update authors if missing
            if not paper.get('authors') or paper.get('authors') == '' or paper.get('authors') == 'N/A':
                if metadata.get('authors'):
                    paper['authors'] = metadata['authors']
            
            # Update description if missing
            if not paper.get('description') or paper.get('description') == '' or paper.get('description') == 'N/A':
                if metadata.get('description'):
                    paper['description'] = metadata['description']
            
        except Exception as e:
            logger.warning(f"Error fetching metadata for paper {paper.get('title', 'Unknown')}: {e}")
        
        return paper
    
    # Fetch metadata concurrently with semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def fetch_with_limit(paper):
        async with semaphore:
            return await fetch_one(paper)
    
    results = await asyncio.gather(*[fetch_with_limit(paper) for paper in papers])
    
    await fetcher.close()
    return results

